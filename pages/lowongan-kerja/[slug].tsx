import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { Job } from '@/types/job';
import { WordPressService } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import JobDetailPage from '@/components/pages/JobDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface JobPageProps {
  job: Job;
  relatedJobs: Job[];
}

export default function JobPage({ job, relatedJobs }: JobPageProps) {
  const breadcrumbItems = [
    { label: 'Lowongan Kerja', href: '/lowongan-kerja/' },
    { label: job.title }
  ];
  
  const pageTitle = job.seo_title || `${job.title} - ${job.company_name} | Nexjob`;
  const pageDescription = job.seo_description || `Lowongan ${job.title} di ${job.company_name}, ${job.lokasi_kota}. Gaji: ${job.gaji}. Lamar sekarang!`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://nexjob.tech/lowongan-kerja/${job.slug}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`https://nexjob.tech/lowongan-kerja/${job.slug}/`} />
        
        {/* Job-specific meta tags */}
        <meta name="job:company" content={job.company_name} />
        <meta name="job:location" content={`${job.lokasi_kota}, ${job.lokasi_provinsi}`} />
        <meta name="job:type" content={job.tipe_pekerjaan} />
        <meta name="job:salary" content={job.gaji} />
        <meta name="job:experience" content={job.pengalaman} />
        <meta name="job:education" content={job.pendidikan} />
      </Head>
      
      <SchemaMarkup schema={generateJobPostingSchema(job)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <JobDetailPage job={job} relatedJobs={relatedJobs} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    
    if (!slug) {
      return { notFound: true };
    }

    const settings = adminService.getSettings();
    
    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.apiUrl);
    currentWpService.setFiltersApiUrl(settings.filtersApiUrl);
    currentWpService.setAuthToken(settings.authToken);

    const job = await currentWpService.getJobBySlug(slug);
    
    if (!job) {
      return { notFound: true };
    }

    // Get related jobs
    const relatedJobs = await currentWpService.getRelatedJobs(job.id, job.kategori_pekerjaan, 4);

    return {
      props: {
        job,
        relatedJobs
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const settings = adminService.getSettings();
    
    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.apiUrl);
    currentWpService.setFiltersApiUrl(settings.filtersApiUrl);
    currentWpService.setAuthToken(settings.authToken);
    
    // Get recent jobs for initial static generation
    const jobsResponse = await currentWpService.getJobs({}, 1, 50);
    
    const paths = jobsResponse.jobs.map((job) => ({
      params: { slug: job.slug }
    }));

    return {
      paths,
      fallback: 'blocking', // Generate pages on-demand for other jobs
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};