import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { WordPressService } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ArticleDetailPage from '@/components/pages/ArticleDetailPage';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleSchema, generateBreadcrumbSchema, generateAuthorSchema } from '@/utils/schemaUtils';

interface ArticlePageProps {
  article: any;
  relatedArticles: any[];
}

export default function ArticlePage({ article, relatedArticles }: ArticlePageProps) {
  const breadcrumbItems = [
    { label: 'Tips Karir', href: '/artikel/' },
    { label: article.title.rendered }
  ];
  
  const pageTitle = article.seo_title || article.title.rendered;
  const pageDescription = article.seo_description;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://nexjob.tech/artikel/${article.slug}/`} />
        {article.featured_media_url && (
          <meta property="og:image" content={article.featured_media_url} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {article.featured_media_url && (
          <meta name="twitter:image" content={article.featured_media_url} />
        )}
        <link rel="canonical" href={`https://nexjob.tech/artikel/${article.slug}/`} />
        
        {/* Article-specific meta tags */}
        <meta name="article:published_time" content={article.date} />
        <meta name="article:modified_time" content={article.modified || article.date} />
        {article.author_info && (
          <meta name="article:author" content={article.author_info.display_name || article.author_info.name} />
        )}
        {article.categories_info && article.categories_info.length > 0 && (
          <meta name="article:section" content={article.categories_info[0].name} />
        )}
        {article.tags_info && article.tags_info.length > 0 && (
          <meta name="article:tag" content={article.tags_info.map((tag: any) => tag.name).join(', ')} />
        )}
      </Head>
      
      <SchemaMarkup schema={generateArticleSchema(article)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />
      {article.author_info && (
        <SchemaMarkup schema={generateAuthorSchema(article.author_info)} />
      )}
      
      <Header />
      <main>
        <ArticleDetailPage article={article} relatedArticles={relatedArticles} />
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

    const article = await currentWpService.getArticleBySlug(slug);
    
    if (!article) {
      return { notFound: true };
    }

    // Get related articles
    const relatedArticles = await currentWpService.getRelatedArticles(article.id.toString(), 3);

    return {
      props: {
        article,
        relatedArticles
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
    
    // Get recent articles for initial static generation
    const articles = await currentWpService.getArticles(20);
    
    const paths = articles.map((article) => ({
      params: { slug: article.slug }
    }));

    return {
      paths,
      fallback: 'blocking', // Generate pages on-demand for other articles
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};