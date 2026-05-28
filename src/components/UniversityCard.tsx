import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface UniversityCardProps {
  name: string;
  country: string;
  tag: string;
  focus: string;
  gradient: string;
}

export const UniversityCard: React.FC<UniversityCardProps> = ({ name, country, tag, focus, gradient }) => {
  return (
    <Card hoverEffect className="group relative overflow-hidden transition-all duration-300">
      <div className={`h-24 ${gradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
      <div className="p-6 relative">
        <div className="absolute -top-10 left-6 h-16 w-16 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center transform group-hover:-translate-y-1 transition-transform">
          <svg className="w-8 h-8 text-indigo-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9L4 10.64V17.5C4 18.33 4.67 19 5.5 19H18.5C19.33 19 20 18.33 20 17.5V10.64L23 9L12 3ZM12 5.18L19.82 9L12 12.82L4.18 9L12 5.18ZM18 17H6V11.73L12 15.06L18 11.73V17Z" />
          </svg>
        </div>
        <div className="mt-8">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-3 border border-indigo-100">
            {tag}
          </span>
          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{name}</h3>
          <p className="text-sm font-medium text-gray-500 mb-4">{country}</p>
          
          <div className="pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Prep Focus</p>
            <p className="text-sm text-gray-700 font-medium">{focus}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1">Details</Button>
          <Button variant="primary" size="sm" className="flex-1">Add to Target</Button>
        </div>
      </div>
    </Card>
  );
};
