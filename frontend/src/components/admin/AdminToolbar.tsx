import type { FilterOption } from './types';
import Icon from './Icon';

type AdminToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchLabel: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterLabel: string;
  filterOptions: FilterOption[];
  onClear: () => void;
  resultCount?: number;
  resultNoun: string;
};

export function AdminToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  filterValue,
  onFilterChange,
  filterLabel,
  filterOptions,
  onClear,
  resultCount,
  resultNoun,
}: AdminToolbarProps) {
  const hasFilters = searchValue.trim() !== '' || filterValue !== 'all';

  return (
    <div className="admin-filters-bar">
      <div className="admin-search-box">
        <Icon name="search" className="admin-search-icon" />
        <input
          type="text"
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="admin-filter-group">
        <label className="admin-filter-label" htmlFor={`admin-filter-${filterLabel}`}>
          {filterLabel}
        </label>
        <select
          id={`admin-filter-${filterLabel}`}
          className="admin-filter-select"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters ? (
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onClear}>
          <Icon name="close" size={12} />
          Limpiar
        </button>
      ) : null}

      {typeof resultCount === 'number' ? (
        <span className="admin-results-count">
          {resultCount} {resultNoun}
        </span>
      ) : null}
    </div>
  );
}

export default AdminToolbar;
