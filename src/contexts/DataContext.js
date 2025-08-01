// --- FILE: src/contexts/DataContext.js ---
import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

export const DataContext = createContext();

const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

export const DataProvider = ({ children }) => {
    const [books, setBooks] = useState(() => JSON.parse(localStorage.getItem('library_books')) || []);
    const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('library_members')) || []);
    const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('library_categories')) || []);
    const [issueHistory, setIssueHistory] = useState(() => JSON.parse(localStorage.getItem('library_history')) || []);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        setLoading(false); // Display local data instantly

        if (isOnline && db) {
            const unsubBooks = onSnapshot(collection(db, "books"), snap => {
                updateLocalStorageAndState('books', snap.docs.map(d => d.data()), setBooks);
            });
            const unsubMembers = onSnapshot(collection(db, "members"), snap => {
                updateLocalStorageAndState('members', snap.docs.map(d => d.data()), setMembers);
            });
            const unsubCategories = onSnapshot(doc(db, "library", "categories"), docSnap => {
                if (docSnap.exists()) {
                    updateLocalStorageAndState('categories', docSnap.data().list || [], setCategories);
                }
            });
            const unsubHistory = onSnapshot(doc(db, "library", "history"), docSnap => {
                if (docSnap.exists()) {
                    updateLocalStorageAndState('history', docSnap.data().log || [], setIssueHistory);
                }
            });
            return () => { 
                unsubBooks(); 
                unsubMembers(); 
                unsubCategories(); 
                unsubHistory();
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [isOnline]);

    const updateLocalStorageAndState = (key, data, setter) => {
        setter(data);
        localStorage.setItem(`library_${key}`, JSON.stringify(data));
    };
    
    const syncDoc = (collectionName, docId, data) => {
        if (isOnline && db) setDoc(doc(db, collectionName, docId), data, { merge: true });
    };

    // --- Book Functions ---
    const addBook = (bookData) => {
        const newBook = { ...bookData, id: generateId(), available: true, issuedTo: null, bookName: bookData.bookName };
        const newBooks = [...books, newBook];
        updateLocalStorageAndState('books', newBooks, setBooks);
        syncDoc("books", newBook.id, newBook);
    };

    const updateBook = (updatedBook) => {
        const newBooks = books.map(b => b.id === updatedBook.id ? updatedBook : b);
        updateLocalStorageAndState('books', newBooks, setBooks);
        syncDoc("books", updatedBook.id, updatedBook);
    };

    const deleteBook = (bookId) => {
        const newBooks = books.filter(b => b.id !== bookId);
        updateLocalStorageAndState('books', newBooks, setBooks);
        if (isOnline && db) deleteDoc(doc(db, "books", bookId));
    };

    const addMultipleBooks = (bookList) => {
        const newBooks = bookList.map(b => ({ ...b, id: generateId(), available: true }));
        const allBooks = [...books, ...newBooks];
        updateLocalStorageAndState('books', allBooks, setBooks);
        if (isOnline && db) {
            const batch = writeBatch(db);
            newBooks.forEach(book => batch.set(doc(db, "books", book.id), book));
            batch.commit();
        }
    };

    // --- Issue/Return/Reissue Functions ---
    const issueBook = (bookId, memberId) => {
        const today = new Date();
        const returnDate = new Date();
        returnDate.setDate(today.getDate() + 14);
        const issuedDateStr = today.toISOString().slice(0,10);
        const returnDateStr = returnDate.toISOString().slice(0,10);

        const newBooks = books.map(book => 
            book.id === bookId 
            ? { ...book, available: false, issuedTo: memberId, issuedDate: issuedDateStr, returnDate: returnDateStr } 
            : book
        );
        updateLocalStorageAndState('books', newBooks, setBooks);
        const issuedBook = newBooks.find(b => b.id === bookId);
        if (issuedBook) syncDoc("books", bookId, issuedBook);

        const historyEntry = { id: generateId(), bookId, memberId, issuedDate: issuedDateStr, returnDate: returnDateStr, status: 'in-hand', returnedOn: null };
        const newHistory = [...issueHistory, historyEntry];
        updateLocalStorageAndState('history', newHistory, setIssueHistory);
        if (isOnline && db) setDoc(doc(db, "library", "history"), { log: newHistory });
    };

    const returnBook = (bookId) => {
        const newBooks = books.map(book => 
            book.id === bookId 
            ? { ...book, available: true, issuedTo: null, issuedDate: null, returnDate: null } 
            : book
        );
        updateLocalStorageAndState('books', newBooks, setBooks);
        const returnedBook = newBooks.find(b => b.id === bookId);
        if (returnedBook) syncDoc("books", bookId, returnedBook);

        const today = new Date().toISOString().slice(0,10);
        const newHistory = issueHistory.map(entry => 
            (entry.bookId === bookId && entry.status === 'in-hand') 
            ? { ...entry, status: 'returned', returnedOn: today } 
            : entry
        );
        updateLocalStorageAndState('history', newHistory, setIssueHistory);
        if (isOnline && db) setDoc(doc(db, "library", "history"), { log: newHistory });
    };
    
    const reissueBook = (bookId) => {
        const today = new Date();
        const newReturnDate = new Date();
        newReturnDate.setDate(today.getDate() + 14);
        const newReturnDateStr = newReturnDate.toISOString().slice(0, 10);

        const newBooks = books.map(book =>
            book.id === bookId
            ? { ...book, returnDate: newReturnDateStr }
            : book
        );
        updateLocalStorageAndState('books', newBooks, setBooks);
        const reissuedBook = newBooks.find(b => b.id === bookId);
        if (reissuedBook) syncDoc("books", bookId, reissuedBook);

        const newHistory = issueHistory.map(entry =>
            (entry.bookId === bookId && entry.status === 'in-hand')
            ? { ...entry, returnDate: newReturnDateStr }
            : entry
        );
        updateLocalStorageAndState('history', newHistory, setIssueHistory);
        if (isOnline && db) setDoc(doc(db, "library", "history"), { log: newHistory });
    };

    // --- Category Functions ---
    const addCategory = (name) => {
        const newCategories = [...categories, name];
        updateLocalStorageAndState('categories', newCategories, setCategories);
        if (isOnline && db) setDoc(doc(db, "library", "categories"), { list: newCategories });
    };

    const deleteCategory = (name) => {
        // Find all books in this category
        const booksToDelete = books.filter(b => b.category === name);
        // Create a new list of books excluding the ones to be deleted
        const remainingBooks = books.filter(b => b.category !== name);
        // Create a new list of categories excluding the one to be deleted
        const newCategories = categories.filter(c => c !== name);

        // Update local state and storage
        updateLocalStorageAndState('books', remainingBooks, setBooks);
        updateLocalStorageAndState('categories', newCategories, setCategories);

        // Sync with Firebase
        if (isOnline && db) {
            const batch = writeBatch(db);
            // Delete all the books in the category
            booksToDelete.forEach(book => {
                batch.delete(doc(db, "books", book.id));
            });
            // Update the categories document
            batch.set(doc(db, "library", "categories"), { list: newCategories });
            batch.commit();
        }
    };

    // --- Member Functions ---
    const addMember = (memberData) => {
        const newMember = { ...memberData, id: generateId(), joinDate: new Date().toISOString().slice(0, 10) };
        const newMembers = [...members, newMember];
        updateLocalStorageAndState('members', newMembers, setMembers);
        syncDoc("members", newMember.id, newMember);
    };
    
    const updateMember = (updatedMember) => {
        const newMembers = members.map(m => m.id === updatedMember.id ? updatedMember : m);
        updateLocalStorageAndState('members', newMembers, setMembers);
        syncDoc("members", updatedMember.id, updatedMember);
    };

    const deleteMember = (memberId) => {
        const newMembers = members.filter(m => m.id !== memberId);
        updateLocalStorageAndState('members', newMembers, setMembers);
        if (isOnline && db) deleteDoc(doc(db, "members", memberId));
    };

    const addMultipleMembers = (memberList) => {
        const newMembers = memberList.map(m => ({ ...m, id: generateId(), joinDate: new Date().toISOString().slice(0, 10) }));
        const allMembers = [...members, ...newMembers];
        updateLocalStorageAndState('members', allMembers, setMembers);
        if (isOnline && db) {
            const batch = writeBatch(db);
            newMembers.forEach(member => batch.set(doc(db, "members", member.id), member));
            batch.commit();
        }
    };

    const value = {
        books, members, categories, issueHistory, loading,
        status: { isOnline, db },
        addBook, updateBook, deleteBook, addMultipleBooks,
        addCategory, deleteCategory,
        addMember, updateMember, deleteMember, addMultipleMembers,
        issueBook, returnBook, reissueBook
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
