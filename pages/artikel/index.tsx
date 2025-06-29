import { GetStaticProps } from 'next';
import Head from 'next/head';
import { WordPressService } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ArticlePage from '@/components/pages/ArticlePage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface ArticlesPageProps {
  articles: any[];
  settings: any;
}

export default function Articles({ articles, settings }: ArticlesPageProps) {
  const breadcrumbItems = [{ label: 'Tips Karir' }];

  return (
    <>
      <Head>
        <title>{settings.articlesTitle}</title>
        <meta name="description" content={settings.articlesDescription} />
        <meta property="og:title" content={settings.articlesTitle} />
        <meta property="og:description" content={settings.articlesDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nexjob.tech/artikel/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={settings.articlesTitle} />
        <meta name="twitter:description" content={settings.articlesDescription} />
        <link rel="canonical" href="https://nexjob.tech/artikel/" />
      </Head>
      
      <SchemaMarkup schema={generateArticleListingSchema(articles)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      
      <Header />
      <main>
        <ArticlePage articles={articles} settings={settings} />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const settings = adminService.getSettings();
    
    // Create isolated wpService instance for this request
    const currentWpService = new WordPressService();
    currentWpService.setBaseUrl(settings.apiUrl);
    currentWpService.setFiltersApiUrl(settings.filtersApiUrl);
    currentWpService.setAuthToken(settings.authToken);
    
    const articles = await currentWpService.getArticles();

    return {
      props: {
        articles,
        settings
      },
      revalidate: 1800, // Revalidate every 30 minutes
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    
    return {
      props: {
        articles: [],
        settings: adminService.getSettings()
      },
      revalidate: 300, // Retry in 5 minutes on error
    };
  }
};