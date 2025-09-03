import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.scss';
import { peopleFromServer } from './data/people';
import { Person } from './types/Person';
import debounce from 'lodash.debounce';

type Props = {
  debounceDelay?: number;
  onPersonSelected?: (person: Person) => void;
};

export const App: React.FC<Props> = ({
  debounceDelay = 300,
  onPersonSelected,
}) => {
  const [selectedItem, setSelectedItem] = useState<Person | null>();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState(selectedItem?.name || '');
  const [appliedQuery, setAppliedQuery] = useState('');

  const debouncedApply = useMemo(() => {
    let lastValue = '';

    return debounce((value: string) => {
      if (value !== lastValue) {
        setAppliedQuery(value);
        lastValue = value;
      }
    }, debounceDelay);
  }, [debounceDelay]);

  useEffect(() => {
    return () => {
      debouncedApply.cancel();
    };
  }, [debouncedApply]);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);

    if (event.target.value !== appliedQuery) {
      debouncedApply(event.target.value);
    }

    setSelectedItem(null);
  };

  const handlePersonSelected = useCallback(
    (person: Person) => {
      setSelectedItem(person);
      setQuery(person.name);
      setAppliedQuery(person.name);
      setIsInputFocused(false);
      if (typeof onPersonSelected === 'function') {
        onPersonSelected(person);
      }
    },
    [onPersonSelected],
  );

  const filteredPeople = useMemo(() => {
    if (isInputFocused && appliedQuery.trim() === '') {
      return peopleFromServer;
    }

    return peopleFromServer.filter(person =>
      person.name.toLowerCase().includes(appliedQuery.trim().toLowerCase()),
    );
  }, [appliedQuery, isInputFocused]);

  return (
    <div className="container">
      <main className="section is-flex is-flex-direction-column">
        {selectedItem ? (
          <h1 className="title" data-cy="title">
            {`${selectedItem.name} (${selectedItem.born} - ${selectedItem.died})`}
          </h1>
        ) : (
          <h1 className="title" data-cy="title">
            No selected person
          </h1>
        )}

        <div className="dropdown is-active">
          <div className="dropdown-trigger">
            <input
              type="text"
              placeholder="Enter a part of the name"
              className="input"
              data-cy="search-input"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => {
                setIsInputFocused(true);
              }}
              onBlur={() => {
                setIsInputFocused(false);
              }}
            />
          </div>

          {isInputFocused && filteredPeople.length !== 0 && (
            <div
              className="dropdown-menu"
              role="menu"
              data-cy="suggestions-list"
            >
              <div className="dropdown-content">
                {filteredPeople.map(person => (
                  <div
                    className="dropdown-item"
                    data-cy="suggestion-item"
                    key={person.slug}
                  >
                    <p
                      className="has-text-link"
                      onMouseDown={() => handlePersonSelected(person)}
                    >
                      {person.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredPeople.length === 0 && (
          <div
            className="
            notification
            is-danger
            is-light
            mt-3
            is-align-self-flex-start
          "
            role="alert"
            data-cy="no-suggestions-message"
          >
            <p className="has-text-danger">No matching suggestions</p>
          </div>
        )}
      </main>
    </div>
  );
};
