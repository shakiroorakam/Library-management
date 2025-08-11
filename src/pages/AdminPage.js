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
    const filteredMembers = useMemo(() => members.filter(m => m.name.toLowerCase().includes(issueMemberSearch.toLowerCase()) || (m.registerNumber && m.registerNumber.toLowerCase().includes(issueMemberSearch.toLowerCase()))), [members, issueMemberSearch]);
    const filteredIssuedBooks = useMemo(() => books.filter(b => {
        if (b.available) return false;
        const member = members.find(m => m.id === b.issuedTo);
        const term = returnSearch.toLowerCase();
        return (
            b.bookName.toLowerCase().includes(term) || 
            String(b.bookNo).toLowerCase().includes(term) || 
            (member && (member.name.toLowerCase().includes(term) || (member.registerNumber && member.registerNumber.toLowerCase().includes(term))))
        );
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
                                    placeholder="Search by member name or reg no..."
                                    items={filteredMembers.map(m => ({...m, display: `${m.name} (${m.registerNumber})`}))}
                                    onSelect={setSelectedMember}
                                    displayKey="display"
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
                                    placeholder="Search by book, member, or reg no..."
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
function MemberManagement({ onEditMember, onViewHistory, onEditClass }) {
    const [view, setView] = useState('classes');
    const [selectedClass, setSelectedClass] = useState(null);

    const handleSelectClass = (className) => {
        setSelectedClass(className);
        setView('students');
    };

    if (view === 'students') {
        return <StudentManagement className={selectedClass} onBack={() => setView('classes')} onEditStudent={onEditMember} />;
    }

    return <ClassManagement onSelectClass={handleSelectClass} onEditClass={onEditClass} />;
}

// --- Class Management Component ---
function ClassManagement({ onSelectClass, onEditClass }) {
    const { classes, deleteClass } = useData();
    const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [classes]);

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <span>Manage Classes</span>
                <button className="btn btn-primary btn-sm" onClick={() => onEditClass({ isNew: true, name: '' })}><i className="fas fa-plus me-1"></i> Add Class</button>
            </div>
            <div className="card-body">
                <ul className="list-group">
                    {sortedClasses.map(cls => (
                        <li key={cls} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>{cls}</span>
                            <div>
                                <button className="btn btn-primary btn-sm me-2" onClick={() => onSelectClass(cls)} title="Add/View Students"><i className="fas fa-user-friends me-1"></i> Students</button>
                                <button className="btn btn-info btn-sm me-2" onClick={() => onEditClass({ name: cls })} title="Edit Class"><i className="fas fa-pencil-alt"></i></button>
                                <button className="btn btn-danger btn-sm" onClick={() => {if(window.confirm(`WARNING: This will delete the class AND all students within it. Are you sure?`)) deleteClass(cls)}} title="Delete Class"><i className="fas fa-trash"></i></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// --- Student Management Component ---
function StudentManagement({ className, onBack, onEditStudent }) {
    const { members, deleteMember, addMultipleMembers } = useData();
    const studentsInClass = useMemo(() => members.filter(m => m.class === className), [members, className]);

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: ["name", "registerNumber"] });
            const newStudents = jsonData.slice(1).filter(s => s.name && s.registerNumber).map(s => ({ ...s, class: className }));
            if (newStudents.length > 0 && window.confirm(`Found ${newStudents.length} students. Import them into "${className}"?`)) {
                addMultipleMembers(newStudents);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <span>Students in "{className}"</span>
                <div>
                    <button className="btn btn-info btn-sm me-2" onClick={() => document.getElementById('student-importer').click()}><i className="fas fa-file-excel me-1"></i> Import</button>
                    <input type="file" id="student-importer" style={{display: 'none'}} accept=".xlsx, .xls" onChange={handleFileImport} />
                    <button className="btn btn-primary btn-sm me-2" onClick={() => onEditStudent({ class: className })}><i className="fas fa-plus me-1"></i> Add Student</button>
                    <button className="btn btn-secondary btn-sm" onClick={onBack}>&larr; Back to Classes</button>
                </div>
            </div>
            <div className="card-body">
                <table className="table table-hover align-middle">
                    <thead><tr><th>Name</th><th>Register Number</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                        {studentsInClass.map(student => (
                            <tr key={student.id}>
                                <td>{student.name}</td>
                                <td>{student.registerNumber}</td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEditStudent(student)} title="Edit Student"><i className="fas fa-pencil-alt"></i></button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => {if(window.confirm('Are you sure?')) deleteMember(student.id)}} title="Delete Student"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Book & Category Management Tab Component ---
function BookAndCategoryManagement({ onEditBook }) {
    const { categories, addCategory, deleteCategory } = useData();
    const [view, setView] = useState('categories');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    
    const sortedCategories = useMemo(() => 
        [...categories].sort(naturalSort), 
    [categories]);

    const handleSelectCategory = (cat) => { setSelectedCategory(cat); setView('books'); };

    if (view === 'books') {
        return <BookList category={selectedCategory} onBack={() => setView('categories')} onEditBook={onEditBook} />;
    }

    return (
        <div className="card">
            <div className="card-header">Manage Categories</div>
            <div className="card-body">
                <form className="d-flex mb-3" onSubmit={e => { e.preventDefault(); if(editingCategory) addCategory(editingCategory); setEditingCategory(null); }}>
                    <input type="text" className="form-control me-2" placeholder="New category name" value={editingCategory || ''} onChange={e => setEditingCategory(e.target.value)} />
                    <button className="btn btn-primary" type="submit">Add</button>
                </form>
                <ul className="list-group">{sortedCategories.map(cat => (
                    <li key={cat} className="list-group-item d-flex justify-content-between align-items-center">
                        <a href="#!" onClick={(e) => { e.preventDefault(); handleSelectCategory(cat); }}>{cat}</a>
                        <div>
                            <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleSelectCategory(cat)} title="View Books"><i className="fas fa-folder-open"></i></button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => {if(window.confirm(`WARNING: This will delete the category AND all books within it. Are you sure?`)) deleteCategory(cat)}} title="Delete Category"><i className="fas fa-trash"></i></button>
                        </div>
                    </li>
                ))}</ul>
            </div>
        </div>
    );
}

// --- BookList (Sub-component for BookAndCategoryManagement) ---
function BookList({ category, onBack, onEditBook }) {
    const { books, deleteBook, addMultipleBooks } = useData();
    
    const booksInCategory = useMemo(() => 
        books.filter(b => b.category === category)
             .sort((a, b) => (a.bookNo || '').localeCompare(b.bookNo || '', undefined, { numeric: true, sensitivity: 'base' })),
    [books, category]);

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
            const newBooks = data.slice(1).map(row => ({ bookNo: row[0] || '', bookName: row[1] || '', author: row[2] || '', publisher: row[3] || '', category })).filter(b => b.bookName);
            if(newBooks.length > 0 && window.confirm(`Found ${newBooks.length} books. Import them into "${category}"?`)){
                addMultipleBooks(newBooks);
                alert("Books imported successfully!");
            } else {
                alert("Could not find books to import.");
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <span>Books in "{category}"</span>
                <button className="btn btn-secondary btn-sm" onClick={onBack}>&larr; Back to Categories</button>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead><tr><th>Book No</th><th>Name</th><th>Author</th><th>Status</th>
                            <th className="text-end">
                                <button className="btn btn-info btn-sm me-2" onClick={() => document.getElementById('book-importer').click()} title="Import from Excel"><i className="fas fa-file-excel"></i></button>
                                <input type="file" id="book-importer" style={{display: 'none'}} accept=".xlsx, .xls" onChange={handleFileImport} />
                                <button className="btn btn-primary btn-sm" onClick={() => onEditBook({ bookNo: '', bookName: '', author: '', publisher: '', category })} title="Add New Book"><i className="fas fa-plus"></i></button>
                            </th>
                        </tr></thead>
                        <tbody>{booksInCategory.map(book => (
                            <tr key={book.id}>
                                <td>{book.bookNo}</td><td>{book.bookName}</td><td>{book.author}</td>
                                <td><span className={`badge text-bg-${book.available ? 'success' : 'warning'}`}>{book.available ? 'Available' : 'Issued'}</span></td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEditBook(book)} title="Edit Book"><i className="fas fa-pencil-alt"></i></button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => {if(window.confirm('Are you sure?')) deleteBook(book.id)}} title="Delete Book"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Main Admin Page Component ---
export default function AdminPage() {
    const { loading, addBook, updateBook, addMember, updateMember, addClass, updateClass } = useData();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingMember, setEditingMember] = useState(null);
    const [viewingMember, setViewingMember] = useState(null);
    const [editingBook, setEditingBook] = useState(null);
    const [editingClass, setEditingClass] = useState(null);

    const EditBookForm = ({ book, onSave, onCancel }) => {
        const [formData, setFormData] = useState(book);
        return (
            <form onSubmit={e => {e.preventDefault(); onSave(formData); }}>
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

    const EditMemberForm = ({ member, onSave, onCancel }) => {
        const [formData, setFormData] = useState(member || { name: '', registerNumber: '', class: '' });
        return (
            <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
                <div className="mb-3"><label className="form-label">Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-control" required/></div>
                <div className="mb-3"><label className="form-label">Register Number</label><input type="text" value={formData.registerNumber} onChange={e => setFormData({ ...formData, registerNumber: e.target.value })} className="form-control" required/></div>
                <div className="mb-3"><label className="form-label">Class</label><input type="text" value={formData.class} className="form-control" disabled readOnly/></div>
                <button type="submit" className="btn btn-success me-2">Save</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </form>
        );
    };

    const EditClassForm = ({ classData, onSave, onCancel }) => {
        const [name, setName] = useState(classData.name || '');
        const handleSubmit = (e) => {
            e.preventDefault();
            if (classData.isNew) {
                addClass(name);
            } else {
                updateClass(classData.name, name);
            }
            onSave();
        };
        return (
            <form onSubmit={handleSubmit}>
                <div className="mb-3"><label className="form-label">Class Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" required/></div>
                <button type="submit" className="btn btn-success me-2">Save</button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </form>
        );
    };

    const MemberHistory = ({ member, books, issueHistory }) => {
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

    const { books, issueHistory } = useData();
    
    if (loading) return <div className="text-center mt-5"><h2>Loading Admin Data...</h2></div>;

    return (
        <div className="admin-dashboard">
            <h1 className="mb-4 text-center">Admin Dashboard</h1>
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item"><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} href="#!" onClick={(e) => {e.preventDefault(); setActiveTab('dashboard')}}>Dashboard</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'manageBooks' ? 'active' : ''}`} href="#!" onClick={(e) => {e.preventDefault(); setActiveTab('manageBooks')}}>Books & Categories</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'manageMembers' ? 'active' : ''}`} href="#!" onClick={(e) => {e.preventDefault(); setActiveTab('manageMembers')}}>Members</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'issueReturn' ? 'active' : ''}`} href="#!" onClick={(e) => {e.preventDefault(); setActiveTab('issueReturn')}}>Issue/Return</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab === 'issuedBooks' ? 'active' : ''}`} href="#!" onClick={(e) => {e.preventDefault(); setActiveTab('issuedBooks')}}>Issued Books</a></li>
            </ul>
            
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'manageBooks' && <BookAndCategoryManagement onEditBook={setEditingBook} />}
            {activeTab === 'manageMembers' && <MemberManagement onEditMember={setEditingMember} onViewHistory={setViewingMember} onEditClass={setEditingClass} />}
            {activeTab === 'issueReturn' && <IssueReturn />}
            {activeTab === 'issuedBooks' && <IssuedBooks />}

            {viewingMember && <Modal title={`History for ${viewingMember.name}`} onClose={() => setViewingMember(null)}><MemberHistory member={viewingMember} books={books} issueHistory={issueHistory} /></Modal>}
            {editingMember && <Modal title={editingMember.id ? 'Edit Student' : 'Add New Student'} onClose={() => setEditingMember(null)}><EditMemberForm member={editingMember} onSave={() => setEditingMember(null)} onCancel={() => setEditingMember(null)} /></Modal>}
            {editingBook && <Modal title={editingBook.id ? 'Edit Book' : 'Add Book'} onClose={() => setEditingBook(null)}><EditBookForm book={editingBook} onSave={editingBook.id ? updateBook : addBook} onCancel={() => setEditingBook(null)} /></Modal>}
            {editingClass && <Modal title={editingClass.isNew ? "Add New Class" : `Edit Class "${editingClass.name}"`} onClose={() => setEditingClass(null)}><EditClassForm classData={editingClass} onSave={() => setEditingClass(null)} onCancel={() => setEditingClass(null)} /></Modal>}
        </div>
    );
}
