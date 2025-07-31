// --- FILE: src/pages/AdminPage.js ---
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../hooks/useData';
import * as XLSX from 'xlsx';

// --- Reusable Modal Component ---
const Modal = ({ title, children, onClose }) => (
    <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">{children}</div>
        </div></div>
    </div>
);

// --- Custom Autocomplete Component ---
const Autocomplete = ({ placeholder, items, onSelect, displayKey, value, onChange }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (item) => {
        onSelect(item);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="position-relative">
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && items.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {items.map((item) => (
                        <li key={item.id} className="list-group-item list-group-item-action" onClick={() => handleSelect(item)}>
                            {item[displayKey]}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// --- Dashboard Tab Component ---
function Dashboard() {
    const { books, members, categories } = useData();
    const totalBooks = books.length;
    const totalMembers = members.length;
    const totalCategories = categories.length;
    const issuedBooksCount = books.filter(b => !b.available).length;

    return (
        <div>
            <div className="row">
                <div className="col-md-3 mb-4">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Total Books</h5>
                            <p className="card-text fs-1 fw-bold">{totalBooks}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Total Members</h5>
                            <p className="card-text fs-1 fw-bold">{totalMembers}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Issued Books</h5>
                            <p className="card-text fs-1 fw-bold">{issuedBooksCount}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 mb-4">
                    <div className="card text-center h-100">
                        <div className="card-body">
                            <h5 className="card-title">Total Categories</h5>
                            <p className="card-text fs-1 fw-bold">{totalCategories}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Issued Books Tab Component ---
function IssuedBooks() {
    const { books, members, returnBook, reissueBook } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const issuedBooks = books.filter(b => !b.available);

    const filteredIssuedBooks = issuedBooks.filter(book => {
        const member = members.find(m => m.id === book.issuedTo);
        const memberName = member ? member.name : '';
        const term = searchTerm.toLowerCase();

        return (
            book.bookName.toLowerCase().includes(term) ||
            String(book.bookNo).toLowerCase().includes(term) ||
            memberName.toLowerCase().includes(term)
        );
    });

    return (
        <div className="card">
            <div className="card-header">All Issued Books</div>
            <div className="card-body">
                <div className="mb-3">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by Book Name, Book No, or Member Name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Book No</th>
                                <th>Book Name</th>
                                <th>Issued To</th>
                                <th>Due Date</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssuedBooks.length > 0 ? filteredIssuedBooks.map(book => {
                                const member = members.find(m => m.id === book.issuedTo);
                                return (
                                    <tr key={book.id}>
                                        <td>{book.bookNo}</td>
                                        <td>{book.bookName}</td>
                                        <td>{member ? member.name : 'Unknown'}</td>
                                        <td>{book.returnDate}</td>
                                        <td className="text-end">
                                            <button 
                                                className="btn btn-success btn-sm me-2" 
                                                onClick={() => {if(window.confirm(`Reissue "${book.bookName}"? This will extend the due date.`)) reissueBook(book.id)}}
                                                title="Reissue Book"
                                            >
                                                Reissue
                                            </button>
                                            <button 
                                                className="btn btn-warning btn-sm" 
                                                onClick={() => {if(window.confirm(`Return "${book.bookName}"?`)) returnBook(book.id)}}
                                                title="Return Book"
                                            >
                                                Return
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-4">No issued books match your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Issue/Return Tab Component ---
function IssueReturn() {
    const { books, members, issueBook, returnBook } = useData();
    
    const [issueBookSearch, setIssueBookSearch] = useState('');
    const [issueMemberSearch, setIssueMemberSearch] = useState('');
    const [selectedIssueBook, setSelectedIssueBook] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    const [returnSearch, setReturnSearch] = useState('');
    const [selectedReturnBook, setSelectedReturnBook] = useState(null);

    const filteredAvailableBooks = useMemo(() => books.filter(b => b.available && (b.bookName.toLowerCase().includes(issueBookSearch.toLowerCase()) || String(b.bookNo).toLowerCase().includes(issueBookSearch.toLowerCase()))), [books, issueBookSearch]);
    const filteredMembers = useMemo(() => members.filter(m => m.name.toLowerCase().includes(issueMemberSearch.toLowerCase())), [members, issueMemberSearch]);
    const filteredIssuedBooks = useMemo(() => books.filter(b => {
        if (b.available) return false;
        const member = members.find(m => m.id === b.issuedTo);
        return (b.bookName.toLowerCase().includes(returnSearch.toLowerCase()) || String(b.bookNo).toLowerCase().includes(returnSearch.toLowerCase()) || (member && member.name.toLowerCase().includes(returnSearch.toLowerCase())));
    }), [books, members, returnSearch]);

    const handleIssueSubmit = (e) => {
        e.preventDefault();
        if (!selectedIssueBook || !selectedMember) return alert("Please select a book and a member.");
        issueBook(selectedIssueBook.id, selectedMember.id);
        alert(`Book issued successfully!`);
        setSelectedIssueBook(null);
        setSelectedMember(null);
    };

    const handleReturnSubmit = (e) => {
        e.preventDefault();
        if (!selectedReturnBook) return alert("Please select a book to return.");
        returnBook(selectedReturnBook.id);
        alert('Book returned successfully!');
        setSelectedReturnBook(null);
    };

    return (
        <div className="row">
            <div className="col-md-6 mb-4 mb-md-0"><div className="card h-100">
                <div className="card-header">Issue a Book</div>
                <div className="card-body d-flex flex-column">
                    <form onSubmit={handleIssueSubmit} className="d-flex flex-column flex-grow-1">
                        <div className="mb-3">
                            <label className="form-label">Search & Select Book</label>
                            {selectedIssueBook ? (
                                <div className="alert alert-info d-flex justify-content-between align-items-center">
                                    <span>{selectedIssueBook.bookNo} - {selectedIssueBook.bookName}</span>
                                    <button className="btn-close" onClick={() => setSelectedIssueBook(null)}></button>
                                </div>
                            ) : (
                                <Autocomplete
                                    placeholder="Search by book name or number..."
                                    items={filteredAvailableBooks.map(b => ({...b, display: `${b.bookNo} - ${b.bookName}`}))}
                                    onSelect={setSelectedIssueBook}
                                    displayKey="display"
                                    value={issueBookSearch}
                                    onChange={(e) => setIssueBookSearch(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Search & Select Member</label>
                            {selectedMember ? (
                                <div className="alert alert-info d-flex justify-content-between align-items-center">
                                    <span>{selectedMember.name}</span>
                                    <button className="btn-close" onClick={() => setSelectedMember(null)}></button>
                                </div>
                            ) : (
                                <Autocomplete
                                    placeholder="Search by member name..."
                                    items={filteredMembers}
                                    onSelect={setSelectedMember}
                                    displayKey="name"
                                    value={issueMemberSearch}
                                    onChange={(e) => setIssueMemberSearch(e.target.value)}
                                />
                            )}
                        </div>
                        <button type="submit" className="btn btn-success mt-auto">Issue Book</button>
                    </form>
                </div>
            </div></div>
            <div className="col-md-6"><div className="card h-100">
                <div className="card-header">Return a Book</div>
                <div className="card-body d-flex flex-column">
                    <form onSubmit={handleReturnSubmit} className="d-flex flex-column flex-grow-1">
                        <div className="mb-3">
                            <label className="form-label">Search & Select Book to Return</label>
                            {selectedReturnBook ? (
                                <div className="alert alert-info d-flex justify-content-between align-items-center">
                                    <span>{selectedReturnBook.bookName}</span>
                                    <button className="btn-close" onClick={() => setSelectedReturnBook(null)}></button>
                                </div>
                            ) : (
                                <Autocomplete
                                    placeholder="Search by book, number, or member..."
                                    items={filteredIssuedBooks.map(b => ({...b, display: `${b.bookName} (To: ${members.find(m=>m.id === b.issuedTo)?.name || 'N/A'})`}))}
                                    onSelect={setSelectedReturnBook}
                                    displayKey="display"
                                    value={returnSearch}
                                    onChange={(e) => setReturnSearch(e.target.value)}
                                />
                            )}
                        </div>
                        <button type="submit" className="btn btn-warning mt-auto">Return Book</button>
                    </form>
                </div>
            </div></div>
        </div>
    );
}

// --- Member Management Tab Component ---
function MemberManagement() {
    const { members, books, issueHistory, addMember, updateMember, deleteMember, addMultipleMembers } = useData();
    const [viewingMember, setViewingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);

    const sortedMembers = useMemo(() => 
        [...members].sort((a, b) => a.name.localeCompare(b.name)), 
    [members]);

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: ["name", "email"] });
            const newMembers = jsonData.slice(1).filter(m => m.name && m.email);
            if (newMembers.length > 0 && window.confirm(`Found ${newMembers.length} members. Import them?`)) {
                addMultipleMembers(newMembers);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // Reset file input
    };

    const MemberHistory = ({ member }) => {
        const memberHistory = issueHistory.filter(h => h.memberId === member.id);
        const inHandHistory = memberHistory.filter(h => h.status === 'in-hand');
        const returnedHistory = memberHistory.filter(h => h.status === 'returned');
        const findBookName = (bookId) => books.find(b => b.id === bookId)?.bookName || 'Unknown Book';
        return (
            <div>
                <h5>Books Currently In Hand</h5>
                {inHandHistory.length > 0 ? (<ul className="list-group mb-4">{inHandHistory.map(h => <li key={h.id} className="list-group-item"><strong>{findBookName(h.bookId)}</strong> (Due: {h.returnDate})</li>)}</ul>) : <p>No books currently in hand.</p>}
                <hr />
                <h5>Returned Books History</h5>
                {returnedHistory.length > 0 ? (<ul className="list-group">{returnedHistory.map(h => <li key={h.id} className="list-group-item"><strong>{findBookName(h.bookId)}</strong> (Returned on: {h.returnedOn})</li>)}</ul>) : <p>No returned books in history.</p>}
            </div>
        );
    };

    const EditMemberForm = ({ member, onSave, onCancel }) => {
        const [formData, setFormData] = useState(member || { name: '', email: '' });
        return (
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                <div className="mb-3"><label className="form-label">Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-control" required/></div>
                <div className="mb-3"><label className="form-label">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-control" required/></div>
                <button type="submit" className="btn btn-success me-2">Save</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </form>
        );
    };

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <span>Manage Members</span>
                <div>
                    <button className="btn btn-info btn-sm me-2" onClick={() => document.getElementById('member-importer').click()}><i className="fas fa-file-excel me-1"></i> Import</button>
                    <input type="file" id="member-importer" style={{display: 'none'}} accept=".xlsx, .xls" onChange={handleFileImport} />
                    <button className="btn btn-primary btn-sm" onClick={() => setEditingMember({})}><i className="fas fa-plus me-1"></i> Add New</button>
                </div>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead><tr><th>Name</th><th>Email</th><th className="text-end">Actions</th></tr></thead>
                        <tbody>{sortedMembers.map(member => (
                            <tr key={member.id}>
                                <td><a href="#!" onClick={(e) => { e.preventDefault(); setViewingMember(member); }}>{member.name}</a></td>
                                <td>{member.email}</td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setViewingMember(member)} title="View History"><i className="fas fa-history"></i></button>
                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingMember(member)} title="Edit Member"><i className="fas fa-pencil-alt"></i></button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => {if(window.confirm('Are you sure?')) deleteMember(member.id)}} title="Delete Member"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
            {viewingMember && <Modal title={`History for ${viewingMember.name}`} onClose={() => setViewingMember(null)}><MemberHistory member={viewingMember} /></Modal>}
            {editingMember && <Modal title={editingMember.id ? 'Edit Member' : 'Add New Member'} onClose={() => setEditingMember(null)}><EditMemberForm member={editingMember} onSave={editingMember.id ? updateMember : addMember} onCancel={() => setEditingMember(null)} /></Modal>}
        </div>
    );
}

// --- Book & Category Management Tab Component ---
function BookAndCategoryManagement() {
    const { books, categories, addBook, updateBook, deleteBook, addCategory, deleteCategory, addMultipleBooks } = useData();
    const [view, setView] = useState('categories');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    
    const sortedCategories = useMemo(() => 
        [...categories].sort(naturalSort), 
    [categories]);

    const handleSelectCategory = (cat) => { setSelectedCategory(cat); setView('books'); };
    
    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const newBooks = data.slice(1).map(row => ({ bookNo: row[0] || '', bookName: row[1] || '', author: row[2] || '', publisher: row[3] || '', category: selectedCategory })).filter(b => b.bookName);
            if(newBooks.length > 0 && window.confirm(`Found ${newBooks.length} books. Import them into "${selectedCategory}"?`)){
                addMultipleBooks(newBooks);
                alert("Books imported successfully!");
            } else {
                alert("Could not find books to import.");
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = ''; // Reset file input
    };
    
    const EditBookForm = ({ book, onSave, onCancel }) => {
        const [formData, setFormData] = useState(book);
        return (
            <form onSubmit={e => {e.preventDefault(); onSave(formData)}}>
                <div className="row">
                    <div className="col-md-3 mb-3"><label className="form-label">Book No</label><input type="text" value={formData.bookNo} onChange={e => setFormData({...formData, bookNo: e.target.value})} className="form-control" required /></div>
                    <div className="col-md-9 mb-3"><label className="form-label">Book Name</label><input type="text" value={formData.bookName} onChange={e => setFormData({...formData, bookName: e.target.value})} className="form-control" required /></div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label">Author</label><input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="form-control" /></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Publisher</label><input type="text" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="form-control" /></div>
                </div>
                <button type="submit" className="btn btn-success me-2">Save</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </form>
        );
    };

    if (view === 'books') {
        const booksInCategory = books.filter(b => b.category === selectedCategory);
        const sortedBooks = booksInCategory.sort((a, b) => 
            (a.bookNo || '').localeCompare(b.bookNo || '', undefined, { numeric: true, sensitivity: 'base' })
        );

        return (
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span>Books in "{selectedCategory}"</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setView('categories')}>&larr; Back to Categories</button>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead><tr><th>Book No</th><th>Name</th><th>Author</th><th>Status</th>
                                <th className="text-end">
                                    <button className="btn btn-info btn-sm me-2" onClick={() => document.getElementById('book-importer').click()} title="Import from Excel"><i className="fas fa-file-excel"></i></button>
                                    <input type="file" id="book-importer" style={{display: 'none'}} accept=".xlsx, .xls" onChange={handleFileImport} />
                                    <button className="btn btn-primary btn-sm" onClick={() => setEditingItem({ bookNo: '', bookName: '', author: '', publisher: '', category: selectedCategory })} title="Add New Book"><i className="fas fa-plus"></i></button>
                                </th>
                            </tr></thead>
                            <tbody>{sortedBooks.map(book => (
                                <tr key={book.id}>
                                    <td>{book.bookNo}</td><td>{book.bookName}</td><td>{book.author}</td>
                                    <td><span className={`badge text-bg-${book.available ? 'success' : 'warning'}`}>{book.available ? 'Available' : 'Issued'}</span></td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingItem(book)} title="Edit Book"><i className="fas fa-pencil-alt"></i></button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => {if(window.confirm('Are you sure?')) deleteBook(book.id)}} title="Delete Book"><i className="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {editingItem && <Modal title={editingItem.id ? 'Edit Book' : 'Add Book'} onClose={() => setEditingItem(null)}><EditBookForm book={editingItem} onSave={editingItem.id ? updateBook : addBook} onCancel={() => setEditingItem(null)} /></Modal>}
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">Manage Categories</div>
            <div className="card-body">
                <form className="d-flex mb-3" onSubmit={e => { e.preventDefault(); if(editingItem) addCategory(editingItem); setEditingItem(null); }}>
                    <input type="text" className="form-control me-2" placeholder="New category name" value={editingItem || ''} onChange={e => setEditingItem(e.target.value)} />
                    <button className="btn btn-primary" type="submit">Add</button>
                </form>
                <ul className="list-group">{sortedCategories.map(cat => (
                    <li key={cat} className="list-group-item d-flex justify-content-between align-items-center">
                        <a href="#!" onClick={(e) => { e.preventDefault(); handleSelectCategory(cat); }}>{cat}</a>
                        <div>
                            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleSelectCategory(cat)} title="View Books"><i className="fas fa-folder-open"></i></button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => {if(window.confirm('This will not delete books inside. Are you sure?')) deleteCategory(cat)}} title="Delete Category"><i className="fas fa-trash"></i></button>
                        </div>
                    </li>
                ))}</ul>
            </div>
        </div>
    );
}

// --- Main Admin Page Component ---
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { loading } = useData();
    
    if (loading) return <div className="text-center mt-5"><h2>Loading Admin Data...</h2></div>;

    return (
        <div>
            <h1 className="mb-4 text-center">Admin Dashboard</h1>
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item"><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} href="#!" onClick={() => setActiveTab('dashboard')}>Dashboard</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'manageBooks' ? 'active' : ''}`} href="#!" onClick={() => setActiveTab('manageBooks')}>Books & Categories</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'manageMembers' ? 'active' : ''}`} href="#!" onClick={() => setActiveTab('manageMembers')}>Members</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'issueReturn' ? 'active' : ''}`} href="#!" onClick={() => setActiveTab('issueReturn')}>Issue/Return</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'issuedBooks' ? 'active' : ''}`} href="#!" onClick={() => setActiveTab('issuedBooks')}>Issued Books</a></li>
            </ul>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'manageBooks' && <BookAndCategoryManagement />}
            {activeTab === 'manageMembers' && <MemberManagement />}
            {activeTab === 'issueReturn' && <IssueReturn />}
            {activeTab === 'issuedBooks' && <IssuedBooks />}
        </div>
    );
}
