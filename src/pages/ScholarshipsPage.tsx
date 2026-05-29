import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import scholarshipsData from '../data/scholarships.json';

export const ScholarshipsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterFunding, setFilterFunding] = useState('All');
  const [selectedScholarship, setSelectedScholarship] = useState(null);

  // Filter logic
  const filteredScholarships = useMemo(() => {
    return scholarshipsData.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filterLevel === 'All' || s.levels.includes(filterLevel);
      const matchesFunding = filterFunding === 'All' || s.fundingType === filterFunding;
      
      return matchesSearch && matchesLevel && matchesFunding;
    });
  }, [searchTerm, filterLevel, filterFunding]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-black text-xl tracking-tight text-slate-800">SCHOLAR NOVA</span>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <Link to="/universities" className="hover:text-indigo-600 transition-colors">Universities</Link>
              <Link to="/scholarships" className="text-indigo-600 border-b-2 border-indigo-600 pb-1">Scholarships</Link>
              <Link to="/interviews" className="hover:text-indigo-600 transition-colors">Interviews</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-indigo-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Discover Your Future</h1>
          <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Explore 30+ fully-funded and partial international scholarships. Find the perfect match for your academic journey.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex items-center bg-white rounded-full p-2 shadow-xl">
            <span className="pl-4 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name or country..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 px-4 py-3 outline-none w-full"
            />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Level:</span>
            {['All', 'S1', 'S2', 'S3'].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filterLevel === lvl 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Funding:</span>
            {['All', 'Full', 'Partial'].map(fund => (
              <button 
                key={fund}
                onClick={() => setFilterFunding(fund)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  filterFunding === fund 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {fund}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 text-slate-500 font-medium">
          Showing <span className="text-slate-800 font-bold">{filteredScholarships.length}</span> scholarships
        </div>

        {/* Grid */}
        {filteredScholarships.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="text-xl font-bold text-slate-800">No scholarships found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredScholarships.map((s) => (
              <div 
                key={s.id} 
                onClick={() => setSelectedScholarship(s)}
                className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                {/* Image Cover */}
                <div className="h-48 overflow-hidden relative bg-slate-200">
                  <img 
                    src={`https://picsum.photos/seed/${s.id}/600/400`} 
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                    <span className="text-lg">{s.flag}</span>
                    <span className="text-xs font-bold text-slate-700">{s.country}</span>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4">{s.provider}</p>
                  
                  <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      s.fundingType === 'Full' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      💰 {s.fundingType} Funded
                    </span>
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-xs font-bold">
                      🎓 {s.levels.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedScholarship(null)}
          ></div>
          
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedScholarship(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-20"
            >
              ✕
            </button>

            {/* Modal Header / Image */}
            <div className="h-64 sm:h-80 relative shrink-0">
              <img 
                src={`https://picsum.photos/seed/${selectedScholarship.id}/1200/600`} 
                alt={selectedScholarship.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{selectedScholarship.flag}</span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
                    {selectedScholarship.country}
                  </span>
                  <span className={`px-3 py-1 backdrop-blur-md rounded-full text-sm font-semibold ${
                    selectedScholarship.fundingType === 'Full' ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                  }`}>
                    {selectedScholarship.fundingType} Funded
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-2">
                  {selectedScholarship.name}
                </h2>
                <p className="text-slate-200 font-medium text-lg">
                  {selectedScholarship.provider}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-8">
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Targeted Levels & Fields</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedScholarship.levels.map(l => (
                        <span key={l} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold">Level: {l}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedScholarship.fields.map(f => (
                        <span key={f} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-medium">{f}</span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Benefits</h4>
                    <ul className="space-y-2">
                      {selectedScholarship.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                          <span className="text-emerald-500 shrink-0">✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Requirements</h4>
                    <div className="space-y-3">
                      {selectedScholarship.requirements.minIELTS && (
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Min. IELTS</span>
                          <span className="font-bold text-slate-800">{selectedScholarship.requirements.minIELTS}</span>
                        </div>
                      )}
                      {selectedScholarship.requirements.minGPA && (
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <span className="text-slate-500 font-medium">Min. GPA</span>
                          <span className="font-bold text-slate-800">{selectedScholarship.requirements.minGPA}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Work Exp.</span>
                        <span className="font-bold text-slate-800 text-right max-w-[60%]">{selectedScholarship.requirements.workExperience}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Application Window</h4>
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-indigo-900 font-medium">Opens</span>
                        <span className="font-bold text-indigo-700">{selectedScholarship.applicationWindow.opensMonth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-900 font-medium">Closes</span>
                        <span className="font-bold text-red-600">{selectedScholarship.applicationWindow.closesMonth}</span>
                      </div>
                      {selectedScholarship.applicationWindow.notes && (
                        <p className="text-xs text-indigo-600/80 mt-3 italic leading-relaxed">
                          * {selectedScholarship.applicationWindow.notes}
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full">
                  ⏱️ Prep: {selectedScholarship.preparationTime}
                </span>
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full">
                  🔥 {selectedScholarship.difficulty}
                </span>
              </div>
              <a 
                href={selectedScholarship.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-center transition-colors shadow-lg shadow-indigo-200"
              >
                Visit Official Website →
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
