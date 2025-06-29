import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { Job } from '@/types/job';
import { wpService, FilterData, JobsResponse } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import JobCard from '@/components/JobCard';
import JobSidebar from '@/components/JobSidebar';
import SearchableSelect from '@/components/SearchableSelect';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface JobSearchPageProps {
  initialJobs: Job[];
  initialFilterData: FilterData | null;
  initialSearchParams: any;
  initialTotalJobs: number;
  settings: any;
}

const JobSearchPage: React.FC<JobSearchPageProps> = ({ 
  initialJobs, 
  initialFilterData, 
  initialSearchParams, 
  initialTotalJobs, 
  settings 
}) => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<FilterData | null>(initialFilterData);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(initialTotalJobs || 0);
  
  // Main search filters
  const [keyword, setKeyword] = useState(initialSearchParams?.search || '');
  const [selectedProvince, setSelectedProvince] = useState(initialSearchParams?.location || '');
  
  // Sidebar filters - now using arrays for multiple selections
  const [sidebarFilters, setSidebarFilters] = useState({
    cities: [] as string[],
    jobTypes: [] as string[],
    experiences: [] as string[],
    educations: [] as string[],
    industries: [] as string[],
    workPolicies: [] as string[],
    categories: initialSearchParams?.category ? [initialSearchParams.category] : [] as string[]
  });

  // Sort filter
  const [sortBy, setSortBy] = useState('newest');

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Ref for tracking if filters have changed
  const filtersRef = useRef({
    keyword: '',
    selectedProvince: '',
    sidebarFilters: sidebarFilters,
    sortBy: 'newest'
  });

  // Load more jobs function for infinite scroll
  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMore || searching) return;

    setLoadingMore(true);
    try {
      const filters = {
        search: keyword,
        location: selectedProvince,
        sortBy: sortBy,
        ...sidebarFilters
      };

      const response = await wpService.getJobs(filters, currentPage + 1, 24);
      
      if (response.jobs.length > 0) {
        setJobs(prevJobs => [...prevJobs, ...response.jobs]);
        setCurrentPage(response.currentPage);
        setHasMore(response.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more jobs:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [keyword, selectedProvince, sortBy, sidebarFilters, currentPage, hasMore, loadingMore, searching]);

  // Infinite scroll hook
  const { isFetching, setTarget, resetFetching } = useInfiniteScroll(loadMoreJobs, {
    threshold: 0.8,
    rootMargin: '200px'
  });

  // Reset fetching state when loading more is complete
  useEffect(() => {
    if (!loadingMore && isFetching) {
      resetFetching();
    }
  }, [loadingMore, isFetching, resetFetching]);

  // Watch for changes in filters to trigger search
  useEffect(() => {
    const currentFilters = {
      keyword,
      selectedProvince,
      sidebarFilters,
      sortBy
    };

    // Check if filters have actually changed
    const filtersChanged = 
      currentFilters.keyword !== filtersRef.current.keyword ||
      currentFilters.selectedProvince !== filtersRef.current.selectedProvince ||
      currentFilters.sortBy !== filtersRef.current.sortBy ||
      JSON.stringify(currentFilters.sidebarFilters) !== JSON.stringify(filtersRef.current.sidebarFilters);

    if (filtersChanged && filterData) {
      filtersRef.current = currentFilters;
      handleFilterSearch();
    }
  }, [keyword, selectedProvince, sidebarFilters, sortBy, filterData]);

  const handleFilterSearch = async () => {
    if (searching) return;
    
    setSearching(true);
    setJobs([]); // Clear existing jobs
    setCurrentPage(1);
    setHasMore(true);
    
    try {
      setError(null);
      const filters = {
        search: keyword,
        location: selectedProvince,
        sortBy: sortBy,
        ...sidebarFilters
      };
      
      // Update URL
      const params = new URLSearchParams();
      if (keyword) params.set('search', keyword);
      if (selectedProvince) params.set('location', selectedProvince);
      router.replace(`/lowongan-kerja/?${params.toString()}`, undefined, { shallow: true });
      
      const response = await wpService.getJobs(filters, 1, 24);
      setJobs(response.jobs);
      setCurrentPage(response.currentPage);
      setHasMore(response.hasMore);
      setTotalJobs(response.totalJobs);
    } catch (err) {
      setError('Gagal memuat data pekerjaan. Silakan coba lagi.');
    } finally {
      setSearching(false);
    }
  };

  const handleMainSearch = async () => {
    await handleFilterSearch();
  };

  const handleSidebarFilterChange = (newFilters: any) => {
    setSidebarFilters(newFilters);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  const handleJobClick = (job: Job) => {
    window.open(`/lowongan-kerja/${job.slug}/`, '_blank');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMainSearch();
    }
  };

  const clearAllFilters = () => {
    setKeyword('');
    setSelectedProvince('');
    setSidebarFilters({
      cities: [],
      jobTypes: [],
      experiences: [],
      educations: [],
      industries: [],
      workPolicies: [],
      categories: []
    });
    setSortBy('newest');
    router.replace('/lowongan-kerja/', undefined, { shallow: true });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (keyword) count++;
    if (selectedProvince) count++;
    Object.values(sidebarFilters).forEach(filterArray => {
      count += filterArray.length;
    });
    return count;
  };

  const removeFilter = (filterType: string, value?: string) => {
    if (filterType === 'keyword') {
      setKeyword('');
    } else if (filterType === 'province') {
      setSelectedProvince('');
      // Also clear cities when province is cleared
      setSidebarFilters(prev => ({ ...prev, cities: [] }));
    } else if (value) {
      setSidebarFilters(prev => ({
        ...prev,
        [filterType]: prev[filterType as keyof typeof prev].filter(item => item !== value)
      }));
    }
  };

  const getProvinceOptions = () => {
    if (!filterData) return [];
    return Object.keys(filterData.nexjob_lokasi_provinsi).map(province => ({
      value: province,
      label: province
    }));
  };

  const breadcrumbItems = [
    { label: 'Lowongan Kerja' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <SchemaMarkup schema={generateJobListingSchema(jobs)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      {/* Header Search */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Centered Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Keyword Search */}
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan skill, posisi, atau perusahaan..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>

              {/* Province Select */}
              <div className="lg:col-span-4">
                <SearchableSelect
                  options={getProvinceOptions()}
                  value={selectedProvince}
                  onChange={setSelectedProvince}
                  placeholder="Semua Provinsi"
                />
              </div>

              {/* Search Button */}
              <div className="lg:col-span-3">
                <button
                  onClick={handleMainSearch}
                  disabled={searching}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {searching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Cari
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mt-4 text-center">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter ({getActiveFiltersCount()})
            </button>
          </div>

          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              
              {keyword && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                  Keyword: {keyword}
                  <button
                    onClick={() => removeFilter('keyword')}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {selectedProvince && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                  Provinsi: {selectedProvince}
                  <button
                    onClick={() => removeFilter('province')}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Sidebar filters */}
              {Object.entries(sidebarFilters).map(([filterType, values]) =>
                values.map((value) => (
                  <span key={`${filterType}-${value}`} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                    {value}
                    <button
                      onClick={() => removeFilter(filterType, value)}
                      className="ml-2 hover:text-primary-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
              
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters - Sticky */}
          <div className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <JobSidebar
                filters={sidebarFilters}
                selectedProvince={selectedProvince}
                sortBy={sortBy}
                onFiltersChange={handleSidebarFilterChange}
                onSortChange={handleSortChange}
                isLoading={searching}
              />
            </div>
          </div>

          {/* Job Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {searching ? 'Mencari...' : `${totalJobs.toLocaleString()} Lowongan Ditemukan`}
                </h1>
                {keyword && (
                  <p className="text-gray-600">
                    Hasil pencarian untuk "<span className="font-medium">{keyword}</span>"
                  </p>
                )}
                {selectedProvince && (
                  <p className="text-gray-600">
                    di <span className="font-medium">{selectedProvince}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Job Grid */}
            {searching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <div key={job.id} style={{ animationDelay: `${index * 0.05}s` }}>
                      <JobCard job={job} onClick={handleJobClick} />
                    </div>
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasMore && (
                  <div 
                    ref={setTarget}
                    className="flex justify-center items-center py-8"
                  >
                    {loadingMore ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <span className="text-gray-600">Memuat lowongan lainnya...</span>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Scroll untuk memuat lebih banyak lowongan
                      </div>
                    )}
                  </div>
                )}

                {/* End of Results */}
                {!hasMore && jobs.length > 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-sm">
                      Anda telah melihat semua {totalJobs.toLocaleString()} lowongan yang tersedia
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada lowongan ditemukan</h3>
                <p className="text-gray-600 mb-4">Coba ubah kriteria pencarian Anda</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchPage;