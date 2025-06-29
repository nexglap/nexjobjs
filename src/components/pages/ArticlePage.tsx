import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { wpService } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import Breadcrumbs from '@/components/Breadcrumbs';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateArticleListingSchema, generateBreadcrumbSchema } from '@/utils/schemaUtils';

interface ArticlePageProps {
  articles: any[];
  settings: any;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ articles, settings }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const breadcrumbItems = [
    { label: 'Tips Karir' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <SchemaMarkup schema={generateArticleListingSchema(articles)} />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbItems)} />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tips & Panduan Karir
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Artikel dan panduan terbaru untuk membantu perjalanan karir Anda
            </p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                href={`/artikel/${article.slug}/`}
                className="group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                  {article.featured_media_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.featured_media_url}
                        alt={article.title.rendered}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(article.date)}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {article.title.rendered}
                    </h2>
                    <div
                      className="text-gray-600 mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
                    />
                    <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                      Baca Selengkapnya
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600">Belum ada artikel tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlePage;