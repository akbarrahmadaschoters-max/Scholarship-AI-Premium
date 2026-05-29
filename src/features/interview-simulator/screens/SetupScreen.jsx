import React, { useState } from 'react';
import interviewConfig from '../data/interviewConfig.json';
import panelistPersonas from '../data/panelistPersonas.json';

const SetupScreen = ({ onStart }) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(''); // "LPDP", "INTERNATIONAL", "UNIVERSITY"
  const [scholarship, setScholarship] = useState('');
  const [level, setLevel] = useState('');
  const [field, setField] = useState('');

  const getCombinationKey = () => {
    if (type === 'LPDP') return `LPDP_${level}`;
    if (type === 'INTERNATIONAL') return `${scholarship}_${level}`;
    if (type === 'UNIVERSITY') return `UNIVERSITY_${level}`;
    return '';
  };

  const getPanelist = () => {
    const key = getCombinationKey();
    return panelistPersonas.find(p => p.assignedTo.includes(key));
  };

  const isStep1Valid = type !== '';
  const isStep2Valid = () => {
    if (type === 'LPDP') return level === 'S2' || level === 'S3';
    if (type === 'INTERNATIONAL') return scholarship !== '' && level !== '';
    if (type === 'UNIVERSITY') return level !== '';
    return false;
  };
  const isStep3Valid = field !== '';

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) return;
    if (step === 2 && !isStep2Valid()) return;
    if (step === 3 && !isStep3Valid) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleStart = () => {
    const config = {
      type,
      scholarship: type === 'INTERNATIONAL' ? scholarship : type,
      level,
      field,
      combinationKey: getCombinationKey(),
      panelist: getPanelist()
    };
    onStart(config);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress Dots */}
      <div className="flex justify-center items-center space-x-3 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === step ? 'bg-indigo-600' : i < step ? 'bg-indigo-300' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex flex-col">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select Interview Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => { setType('LPDP'); setScholarship(''); setLevel(''); }}
                className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                  type === 'LPDP' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="text-4xl mb-4 text-center">🏛️</div>
                <h3 className="text-lg font-bold text-center mb-2">LPDP</h3>
                <p className="text-sm text-gray-600 text-center">Beasiswa pemerintah Indonesia jenjang S2 & S3</p>
              </div>

              <div 
                onClick={() => { setType('INTERNATIONAL'); setScholarship(''); setLevel(''); }}
                className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                  type === 'INTERNATIONAL' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="text-4xl mb-4 text-center">🌍</div>
                <h3 className="text-lg font-bold text-center mb-2">International Scholarship</h3>
                <p className="text-sm text-gray-600 text-center">Erasmus, AAS, Fulbright, Chevening</p>
              </div>

              <div 
                onClick={() => { setType('UNIVERSITY'); setScholarship(''); setLevel(''); }}
                className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
                  type === 'UNIVERSITY' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-200'
                }`}
              >
                <div className="text-4xl mb-4 text-center">🎓</div>
                <h3 className="text-lg font-bold text-center mb-2">University Admission</h3>
                <p className="text-sm text-gray-600 text-center">Interview masuk universitas luar negeri</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="flex-1 max-w-xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Level & Scholarship Details</h2>
            
            <div className="space-y-6">
              {type === 'INTERNATIONAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Scholarship Program</label>
                  <select 
                    value={scholarship} 
                    onChange={e => { setScholarship(e.target.value); setLevel(''); }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Scholarship --</option>
                    {Object.keys(interviewConfig.types.INTERNATIONAL.subtypes).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Degree Level
                  {type === 'LPDP' && (
                    <span className="ml-2 text-xs text-gray-400 font-normal group relative cursor-help">
                      (ⓘ Info)
                      <div className="absolute hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded -top-8 left-12 z-10">
                        LPDP tidak membuka S1 reguler
                      </div>
                    </span>
                  )}
                </label>
                <select 
                  value={level} 
                  onChange={e => setLevel(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Choose Level --</option>
                  {type === 'LPDP' && interviewConfig.types.LPDP.availableLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                  {type === 'INTERNATIONAL' && scholarship && interviewConfig.types.INTERNATIONAL.subtypes[scholarship].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                  {type === 'UNIVERSITY' && interviewConfig.types.UNIVERSITY.availableLevels.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {!isStep2Valid() && (level !== '' || scholarship !== '') && (
                <p className="text-red-500 text-sm mt-2">
                  Pilihan kombinasi level dan beasiswa tidak valid.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="flex-1 max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select Field of Study</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {interviewConfig.fields.map(f => (
                <div 
                  key={f}
                  onClick={() => setField(f)}
                  className={`cursor-pointer p-4 rounded-xl border-2 text-center font-medium transition-all ${
                    field === f ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-200 text-gray-700'
                  }`}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="flex-1 max-w-xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Confirm Your Setup</h2>
            
            <div className="bg-gray-800 rounded-xl p-6 text-white mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-600 pb-2">Interview Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400 block">Type:</span> {type}</div>
                <div><span className="text-gray-400 block">Scholarship:</span> {type === 'INTERNATIONAL' ? scholarship : type}</div>
                <div><span className="text-gray-400 block">Level:</span> {level}</div>
                <div><span className="text-gray-400 block">Field:</span> {field}</div>
              </div>
            </div>

            {getPanelist() && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 mb-8">
                <img 
                  src={getPanelist().avatarUrl} 
                  alt={getPanelist().name} 
                  className="w-10 h-10 rounded-full bg-gray-100"
                />
                <div>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Your Assigned Panelist</p>
                  <p className="font-bold text-gray-800">{getPanelist().name}</p>
                  <p className="text-sm text-gray-500">{getPanelist().title}</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleStart}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors shadow-md"
            >
              Start Interview →
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                ← Back
              </button>
            ) : <div></div>}
            
            <button 
              onClick={handleNext}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid()) || (step === 3 && !isStep3Valid)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupScreen;
