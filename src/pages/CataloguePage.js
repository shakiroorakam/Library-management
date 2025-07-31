// --- FILE: src/pages/CataloguePage.js ---
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';

export default function CataloguePage() {
    const { books, members, categories, loading } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, available, issued
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' or specific category

    const getMemberName = (memberId) => {
        const member = members.find(m => m.id === memberId);
        return member ? member.name : 'Unknown';
    };

    const filteredAndSortedBooks = useMemo(() => {
        return books
            .filter(book => {
                const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
                
                const matchesSearch = (book.bookName || book.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (book.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      (book.bookNo || '').toString().toLowerCase().includes(searchTerm.toLowerCase());

                const matchesAvailability = filter === 'all' || (filter === 'available' && book.available) || (filter === 'issued' && !book.available);
                
                return matchesCategory && matchesSearch && matchesAvailability;
            })
            .sort((a, b) => 
                (a.bookNo || '').localeCompare(b.bookNo || '', undefined, { numeric: true, sensitivity: 'base' })
            );
    }, [books, searchTerm, filter, categoryFilter]);


    if (loading) {
        return <div className="text-center mt-5"><h2>Loading Catalogue...</h2></div>;
    }

    return (
        <div className="public-catalogue">
            <h1 className="mb-4 text-center">Book Catalogue</h1>
            <div className="row mb-4">
                <div className="col-lg-4 mb-2">
                    <input type="text" className="form-control" placeholder="Search by name, author, book no..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="col-md-6 col-lg-4 mb-2">
                     <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                        <option value="all">All Categories</option>
                        {categories.map((cat, index) => <option key={index} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="col-md-6 col-lg-4 mb-2">
                    <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="available">Available Only</option>
                        <option value="issued">Issued Only</option>
                    </select>
                </div>
            </div>
            <div className="row">
                {filteredAndSortedBooks.length > 0 ? filteredAndSortedBooks.map(book => (
                    <div key={book.id} className="col-md-6 col-lg-4 mb-4">
                        <div className={`card h-100 shadow-sm`}>
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{book.bookName || book.title}</h5>
                                <h6 className="card-subtitle mb-2 text-muted">By {book.author || 'N/A'}</h6>
                                <p className="card-text small mb-1"><strong>Book No:</strong> {book.bookNo || 'N/A'}</p>
                                <p className="card-text small mb-1"><strong>Publisher:</strong> {book.publisher || 'N/A'}</p>
                                <p className="card-text small"><strong>Category:</strong> {book.category || 'N/A'}</p>
                                <div className="mt-auto pt-3">
                                    {book.available ? (
                                        <div className="text-success fw-bold"><i className="fas fa-check-circle me-2"></i>Available</div>
                                    ) : (
                                        <div className="text-warning fw-bold">
                                            <div><i className="fas fa-times-circle me-2"></i>Issued</div>
                                            <small className="text-muted fw-normal">To: {getMemberName(book.issuedTo)}</small><br/>
                                            <small className="text-muted fw-normal">Return by: {book.returnDate}</small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (<div className="col text-center p-5"><p>No books match your criteria.</p></div>)}
            </div>
        </div>
    );
}
