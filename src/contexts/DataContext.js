// --- FILE: src/contexts/DataContext.js ---
import React, { createContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

export const DataContext = createContext();

const generateId = () => `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

export const DataProvider = ({ children }) => {
    // --- State Management ---
    const [books, setBooks] = useState(() => JSON.parse(localStorage.getItem('library_books')) || []);
    const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('library_members')) || []);
    const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('library_categories')) || []);
    const [issueHistory, setIssueHistory] = useState(() => JSON.parse(localStorage.getItem('library_history')) || []);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- Core Offline & Sync Logic ---
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load local data instantly
        setLoading(false);

        // If online, sync local changes up, then listen for new changes.
        if (isOnline && db) {
            const syncAndListen = async () => {
                // 1. Sync local changes UP to Firebase if needed
                if (localStorage.getItem('needsSync') === 'true') {
                    console.log("Connection restored. Syncing local changes to Firebase...");
                    await syncAllLocalDataToFirebase();
                    localStorage.setItem('needsSync', 'false');
                    console.log("Sync complete.");
                }

                // 2. Now, listen for real-time updates from Firebase
                const unsubBooks = onSnapshot(collection(db, "books"), snap => updateLocalStorageAndState('books', snap.docs.map(d => d.data()), setBooks));
                const unsubMembers = onSnapshot(collection(db, "members"), snap => updateLocalStorageAndState('members', snap.docs.map(d => d.data()), setMembers));
                const unsubCategories = onSnapshot(doc(db, "library", "categories"), docSnap => { if (docSnap.exists()) updateLocalStorageAndState('categories', docSnap.data().list || [], setCategories); });
                const unsubHistory = onSnapshot(doc(db, "library", "history"), docSnap => { if (docSnap.exists()) updateLocalStorageAndState('history', docSnap.data().log || [], setIssueHistory); });
                
                return () => { unsubBooks(); unsubMembers(); unsubCategories(); unsubHistory(); };
            };
            
            syncAndListen();
        }
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOnline]);

    // --- Helper Functions ---
    const updateLocalStorageAndState = (key, data, setter) => {
        setter(data);
        localStorage.setItem(`library_${key}`, JSON.stringify(data));
    };

    const syncAllLocalDataToFirebase = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        
        // Batch write all local data to Firebase
        books.forEach(book => batch.set(doc(db, "books", book.id), book));
        members.forEach(member => batch.set(doc(db, "members", member.id), member));
        batch.set(doc(db, "library", "categories"), { list: categories });
        batch.set(doc(db, "library", "history"), { log: issueHistory });

        await batch.commit();
    };
    
    const handleDataChange = (key, data, setter, docInfo) => {
        updateLocalStorageAndState(key, data, setter);
        if (isOnline && db) {
            if (docInfo) { // For single doc operations like add/update
                setDoc(doc(db, docInfo.collection, docInfo.id), docInfo.data, { merge: true });
            }
        } else {
            localStorage.setItem('needsSync', 'true');
        }
    };

    // --- Data Modification Functions ---
    const addBook = (bookData) => {
        const newBook = { ...bookData, id: generateId(), available: true, issuedTo: null };
        handleDataChange('books', [...books, newBook], setBooks, { collection: 'books', id: newBook.id, data: newBook });
    };

    const updateBook = (updatedBook) => {
        const newBooks = books.map(b => b.id === updatedBook.id ? updatedBook : b);
        handleDataChange('books', newBooks, setBooks, { collection: 'books', id: updatedBook.id, data: updatedBook });
    };

    const deleteBook = (bookId) => {
        const newBooks = books.filter(b => b.id !== bookId);
        updateLocalStorageAndState('books', newBooks, setBooks);
        if (isOnline && db) deleteDoc(doc(db, "books", bookId));
        else localStorage.setItem('needsSync', 'true');
    };

    const addMultipleBooks = (bookList) => {
        const newBooks = bookList.map(b => ({ ...b, id: generateId(), available: true }));
        const allBooks = [...books, ...newBooks];
        updateLocalStorageAndState('books', allBooks, setBooks);
        if (isOnline && db) {
            const batch = writeBatch(db);
            newBooks.forEach(book => batch.set(doc(db, "books", book.id), book));
            batch.commit();
        } else {
            localStorage.setItem('needsSync', 'true');
        }
    };

    const issueBook = (bookId, memberId) => {
        const today = new Date();
        const returnDate = new Date();
        returnDate.setDate(today.getDate() + 14);
        const issuedDateStr = today.toISOString().slice(0,10);
        const returnDateStr = returnDate.toISOString().slice(0,10);

        const newBooks = books.map(book => book.id === bookId ? { ...book, available: false, issuedTo: memberId, issuedDate: issuedDateStr, returnDate: returnDateStr } : book);
        const issuedBook = newBooks.find(b => b.id === bookId);
        handleDataChange('books', newBooks, setBooks, { collection: 'books', id: bookId, data: issuedBook });

        const historyEntry = { id: generateId(), bookId, memberId, issuedDate: issuedDateStr, returnDate: returnDateStr, status: 'in-hand', returnedOn: null };
        const newHistory = [...issueHistory, historyEntry];
        handleDataChange('history', newHistory, setIssueHistory, { collection: 'library', id: 'history', data: { log: newHistory } });
    };

    const returnBook = (bookId) => {
        const newBooks = books.map(book => book.id === bookId ? { ...book, available: true, issuedTo: null, issuedDate: null, returnDate: null } : book);
        const returnedBook = newBooks.find(b => b.id === bookId);
        handleDataChange('books', newBooks, setBooks, { collection: 'books', id: bookId, data: returnedBook });

        const today = new Date().toISOString().slice(0,10);
        const newHistory = issueHistory.map(entry => (entry.bookId === bookId && entry.status === 'in-hand') ? { ...entry, status: 'returned', returnedOn: today } : entry);
        handleDataChange('history', newHistory, setIssueHistory, { collection: 'library', id: 'history', data: { log: newHistory } });
    };
    
    const reissueBook = (bookId) => {
        const newReturnDate = new Date();
        newReturnDate.setDate(newReturnDate.getDate() + 14);
        const newReturnDateStr = newReturnDate.toISOString().slice(0, 10);

        const newBooks = books.map(book => book.id === bookId ? { ...book, returnDate: newReturnDateStr } : book);
        const reissuedBook = newBooks.find(b => b.id === bookId);
        handleDataChange('books', newBooks, setBooks, { collection: 'books', id: bookId, data: reissuedBook });

        const newHistory = issueHistory.map(entry => (entry.bookId === bookId && entry.status === 'in-hand') ? { ...entry, returnDate: newReturnDateStr } : entry);
        handleDataChange('history', newHistory, setIssueHistory, { collection: 'library', id: 'history', data: { log: newHistory } });
    };

    const addCategory = (name) => {
        const newCategories = [...categories, name];
        handleDataChange('categories', newCategories, setCategories, { collection: 'library', id: 'categories', data: { list: newCategories } });
    };

    const deleteCategory = (name) => {
        const booksToDelete = books.filter(b => b.category === name);
        const remainingBooks = books.filter(b => b.category !== name);
        const newCategories = categories.filter(c => c !== name);

        updateLocalStorageAndState('books', remainingBooks, setBooks);
        updateLocalStorageAndState('categories', newCategories, setCategories);

        if (isOnline && db) {
            const batch = writeBatch(db);
            booksToDelete.forEach(book => batch.delete(doc(db, "books", book.id)));
            batch.set(doc(db, "library", "categories"), { list: newCategories });
            batch.commit();
        } else {
            localStorage.setItem('needsSync', 'true');
        }
    };

    const addMember = (memberData) => {
        const newMember = { ...memberData, id: generateId(), joinDate: new Date().toISOString().slice(0, 10) };
        handleDataChange('members', [...members, newMember], setMembers, { collection: 'members', id: newMember.id, data: newMember });
    };
    
    const updateMember = (updatedMember) => {
        const newMembers = members.map(m => m.id === updatedMember.id ? updatedMember : m);
        handleDataChange('members', newMembers, setMembers, { collection: 'members', id: updatedMember.id, data: updatedMember });
    };

    const deleteMember = (memberId) => {
        const newMembers = members.filter(m => m.id !== memberId);
        updateLocalStorageAndState('members', newMembers, setMembers);
        if (isOnline && db) deleteDoc(doc(db, "members", memberId));
        else localStorage.setItem('needsSync', 'true');
    };

    const addMultipleMembers = (memberList) => {
        const newMembers = memberList.map(m => ({ ...m, id: generateId(), joinDate: new Date().toISOString().slice(0, 10) }));
        const allMembers = [...members, ...newMembers];
        updateLocalStorageAndState('members', allMembers, setMembers);
        if (isOnline && db) {
            const batch = writeBatch(db);
            newMembers.forEach(member => batch.set(doc(db, "members", member.id), member));
            batch.commit();
        } else {
            localStorage.setItem('needsSync', 'true');
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
