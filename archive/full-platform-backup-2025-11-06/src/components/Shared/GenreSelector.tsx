import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { GENRES } from '../../lib/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  maxSelections?: number;
  label?: string;
  placeholder?: string;
}

export function GenreSelector({
  selectedGenres,
  onChange,
  maxSelections,
  label = 'Select Genres',
  placeholder = 'Choose genres...',
}: GenreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGenres = GENRES.filter((genre) =>
    genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onChange(selectedGenres.filter((g) => g !== genre));
    } else {
      if (maxSelections && selectedGenres.length >= maxSelections) {
        return;
      }
      onChange([...selectedGenres, genre]);
    }
  };

  const handleRemoveGenre = (genre: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedGenres.filter((g) => g !== genre));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {maxSelections && (
          <span className="text-gray-500 text-xs ml-2">
            (Max {maxSelections}, selected: {selectedGenres.length})
          </span>
        )}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-4 py-2 border border-gray-300 rounded-md cursor-pointer bg-white hover:border-gray-400 transition-colors"
      >
        {selectedGenres.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedGenres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gigmate-blue text-white text-sm rounded-md"
              >
                {genre}
                <button
                  onClick={(e) => handleRemoveGenre(genre, e)}
                  className="hover:bg-blue-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown
          className={`absolute right-3 top-3 w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search genres..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredGenres.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No genres found</div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {filteredGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  const isDisabled =
                    maxSelections &&
                    selectedGenres.length >= maxSelections &&
                    !isSelected;

                  return (
                    <button
                      key={genre}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGenre(genre);
                      }}
                      disabled={isDisabled}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-gigmate-blue text-white'
                          : isDisabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>
                {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
              </span>
              {selectedGenres.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="text-gigmate-blue hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
