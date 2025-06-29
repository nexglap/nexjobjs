import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { WordPressService, FilterData } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobSearchPage from '@/components/pages/JobSearchPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface JobsPageProps {
  initialJobs: any[];
  filterData: FilterData | null;
  settings: any;
  searchParams: any;
  totalJobs: number;
}

export default function Jobs({ initialJobs, filterData, settings, searchParams, totalJobs }: JobsPageProps) {
  const breadcrumbItems = [{ label: 'Lowongan Kerja' }];
  
  // Generate dynamic title and description based on search params
  let pageTitle = settings.jobsTitle;
  let pageDescription = settings.jobsDescription;
  
  if (searchParams.search) {
    pageTitle = `${searchParams.search} - Lowongan Kerja | Nexjob`;
    pageDescription = `Temukan lowongan kerja ${searchParams.search} terbaru di Indonesia. ${totalJobs} lowongan tersedia.`;
  }
  
  if (searchParams.location) {
    pageTitle = `Lowongan Kerja di ${searchParams.location} | Nexjob`;
    pageDescription = `Cari lowongan kerja terbaru di ${searchParams.location}. ${totalJobs} lowongan tersedia.`;
  }
  
  if (searchParams.search && searchParams.location) {
    pageTitle = `${searchParams.search} di ${searchParams.location} - Lowongan Kerja | Nexjob`;
    pageDescription = `Lowongan kerja ${searchParams.search} di ${searchParams.location}. ${totalJobs} lowongan tersedia.`;
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nexjob.tech/lowongan-kerja/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href="https://nexjob.tech/lowongan-kerja/" />
      </Head>
      
      <SchemaMarkup schema={generateJobListingSchema(initialJobs)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <JobSearchPage 
          initialJobs={initialJobs}
          initialFilterData={filterData}
          initialSearchParams={searchParams}
          initialTotalJobs={totalJobs}
          settings={settings}
        />
      </main>
      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  try {
    const settings = adminService.getSettings();
    
    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.apiUrl);
    currentWpService.setFiltersApiUrl(settings.filtersApiUrl);
    currentWpService.setAuthToken(settings.authToken);
    
    // Parse search parameters
    const searchParams = {
      search: query.search as string || '',
      location: query.location as string || '',
      category: query.category as string || '',
    };
    
    // Build filters for API call
    const filters = {
      search: searchParams.search,
      location: searchParams.location,
      categories: searchParams.category ? [searchParams.category] : [],
      sortBy: 'newest'
    };
    
    // Fetch data
    const [jobsResponse, filterData] = await Promise.all([
      currentWpService.getJobs(filters, 1, 24),
      currentWpService.getFiltersData()
    ]);

    return {
      props: {
        initialJobs: jobsResponse.jobs,
        filterData,
        settings,
        searchParams,
        totalJobs: jobsResponse.totalJobs
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {
        initialJobs: [],
        filterData: null,
        settings: adminService.getSettings(),
        searchParams: {},
        totalJobs: 0
      }
    };
  }
};