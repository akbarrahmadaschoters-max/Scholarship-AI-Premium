import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import universitiesData from '../data/universities.json';

export const UniversitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selectedUni, setSelectedUni] = useState(null);
  const [activeLevelTab, setActiveLevelTab] = useState('S1');

  // Extract unique countries
  const countries = ['All', ...new Set(universitiesData.map(u => u.country))].sort();

  // Filter logic
  const filteredUnis = useMemo(() => {
    return universitiesData.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = filterCountry === 'All' || u.country === filterCountry;
      const matchesType = filterType === 'All' || u.type === filterType;
      
      return matchesSearch && matchesCountry && matchesType;
    });
  }, [searchTerm, filterCountry, filterType]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* Navbar */}

      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">World's Top Universities</h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Explore the Top 50 global universities. Discover admission rates, requirements, and popular programs for Indonesian students.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex items-center bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-xl">
            <span className="pl-4 text-slate-300">🔍</span>
            <input 
              type="text" 
              placeholder="Search by university name or city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder-slate-400 px-4 py-3 outline-none w-full"
            />
            <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-bold transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Country:</span>
            <select 
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-semibold"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Type:</span>
            {['All', 'Public', 'Private'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filterType === type 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 text-slate-500 font-medium">
          Showing <span className="text-slate-800 font-bold">{filteredUnis.length}</span> universities
        </div>

        {/* Grid */}
        {filteredUnis.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="text-xl font-bold text-slate-800">No universities found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUnis.map((u) => (
              <div 
                key={u.id} 
                onClick={() => { setSelectedUni(u); setActiveLevelTab('S1'); }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
              >
                {/* Image Cover */}
                <div className="h-40 overflow-hidden relative bg-slate-200">
                  <img 
                    src={`https://picsum.photos/seed/${u.id}/600/400`} 
                    alt={u.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-base">{u.flag}</span>
                    <span className="text-xs font-bold text-slate-700">{u.country}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-indigo-600 text-white px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1 font-bold text-xs">
                    🏆 #{u.rank}
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors mb-1 line-clamp-2">
                    {u.name}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-1">
                    📍 {u.city} • <span className="italic">{u.type}</span>
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acceptance</span>
                      <span className="text-sm font-bold text-slate-700">{u.acceptanceRate ? `${u.acceptanceRate}%` : 'N/A'}</span>
                    </div>
                    <span className="text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedUni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedUni(null)}
          ></div>
          
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedUni(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-20"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="h-56 relative shrink-0">
              <img 
                src={`https://picsum.photos/seed/${selectedUni.id}/1200/400`} 
                alt={selectedUni.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{selectedUni.flag}</span>
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-xs font-semibold">
                      {selectedUni.country}
                    </span>
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-xs font-semibold">
                      {selectedUni.type}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black leading-tight mb-1">{selectedUni.name}</h2>
                  <p className="text-slate-300 font-medium text-sm flex items-center gap-1">📍 {selectedUni.city}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1">QS World Rank</span>
                  <span className="text-5xl font-black text-white">#{selectedUni.rank}</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
              
              {/* Left Sidebar (Quick Stats) */}
              <div className="w-full md:w-64 bg-slate-50 p-6 border-r border-slate-100 shrink-0">
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Acceptance Rate</h4>
                  <div className="text-2xl font-black text-slate-800">
                    {selectedUni.acceptanceRate ? `${selectedUni.acceptanceRate}%` : 'N/A'}
                  </div>
                  {selectedUni.acceptanceRate && selectedUni.acceptanceRate < 15 && (
                    <span className="inline-block mt-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">Highly Selective</span>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Application Intakes</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedUni.intakeMonths.map(m => (
                      <span key={m} className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-2 py-1 rounded-md">{m}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supported Scholarships</h4>
                  <div className="space-y-1.5">
                    {selectedUni.scholarshipsAvailable.map(sid => (
                      <div key={sid} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center">
                        <span className="mr-1.5">🎓</span> {sid}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6">
                
                {/* Tabs for Levels */}
                <div className="flex border-b border-slate-200 mb-6">
                  {['S1', 'S2', 'S3'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setActiveLevelTab(lvl)}
                      className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
                        activeLevelTab === lvl 
                          ? 'border-indigo-600 text-indigo-600' 
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {lvl === 'S1' ? 'Undergraduate (S1)' : lvl === 'S2' ? 'Master (S2)' : 'Doctorate (S3)'}
                    </button>
                  ))}
                </div>

                {/* Level Requirements Content */}
                <div className="mb-8">
                  {selectedUni.generalRequirements[activeLevelTab] ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Standardized Tests */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Language & Tests</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm font-medium">Min. IELTS</span>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{selectedUni.generalRequirements[activeLevelTab].minIELTS || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm font-medium">Min. TOEFL</span>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{selectedUni.generalRequirements[activeLevelTab].minTOEFL || 'N/A'}</span>
                          </div>
                          
                          {activeLevelTab === 'S1' && selectedUni.generalRequirements.S1.minSAT && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 text-sm font-medium">Min. SAT</span>
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{selectedUni.generalRequirements.S1.minSAT}</span>
                            </div>
                          )}
                          {activeLevelTab === 'S1' && selectedUni.generalRequirements.S1.otherTests.length > 0 && (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                              <span className="text-xs text-slate-500 block mb-1">Required Curriculums/Tests:</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedUni.generalRequirements.S1.otherTests.map(t => (
                                  <span key={t} className="text-xs font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Academic & Other Req */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic & Specifics</h5>
                        <div className="space-y-2 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-sm font-medium">Min. GPA</span>
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{selectedUni.generalRequirements[activeLevelTab].minGPA || 'Varies'}</span>
                          </div>
                          
                          {activeLevelTab === 'S2' && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 text-sm font-medium">Work Exp.</span>
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-right max-w-[60%]">{selectedUni.generalRequirements.S2.workExperience}</span>
                            </div>
                          )}

                          {activeLevelTab === 'S3' && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm font-medium">Proposal</span>
                                <span className="font-bold text-slate-800">
                                  {selectedUni.generalRequirements.S3.researchProposal ? '✅ Required' : '❌ Not Req'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-600 text-sm font-medium">Supervisor</span>
                                <span className="font-bold text-slate-800">
                                  {selectedUni.generalRequirements.S3.supervisorRequired ? '✅ Required upfront' : '❌ Assigned later'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                           <span className="text-xs font-semibold text-slate-600 block">Deadline:</span>
                           <span className="text-sm font-bold text-rose-600">{selectedUni.applicationDeadline[activeLevelTab]}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-500 italic bg-slate-50 rounded-xl">Data not available for this level.</div>
                  )}

                  {/* Notes Alert */}
                  {selectedUni.generalRequirements[activeLevelTab]?.notes && (
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex items-start gap-3">
                      <span className="text-indigo-500">💡</span>
                      <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                        {selectedUni.generalRequirements[activeLevelTab].notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Popular Subjects */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Popular Subjects (World Rank)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUni.popularSubjects.map((sub, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="bg-white border border-slate-200 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-black text-slate-700 text-sm shadow-sm">
                          {sub.subjectRank ? `#${sub.subjectRank}` : '-'}
                        </div>
                        <div>
                          <h6 className="font-bold text-slate-800 text-sm">{sub.name}</h6>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Levels: {sub.availableLevels.join(', ')}
                          </div>
                          {sub.additionalNotes && (
                            <div className="text-[10px] text-indigo-600 mt-1 font-semibold italic">{sub.additionalNotes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end shrink-0">
              <a 
                href={selectedUni.website}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-center transition-colors shadow-lg"
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
