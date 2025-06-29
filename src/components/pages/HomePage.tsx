import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Search, TrendingUp, ArrowRight, Users, Building, Code, Heart, Calculator, Truck } from 'lucide-react';
import { wpService, FilterData } from '@/services/wpService';
import { adminService } from '@/services/adminService';
import SearchableSelect from '@/components/SearchableSelect';
import SchemaMarkup from '@/components/SEO/SchemaMarkup';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/utils/schemaUtils';

interface HomePageProps {
  initialArticles: any[];
  initialFilterData: FilterData | null;
  settings: any;
}

const HomePage: React.FC<HomePageProps> = ({ initialArticles, initialFilterData, settings }) => {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [articles, setArticles] = useState<any[]>(initialArticles || []);
  const [filterData, setFilterData] = useState<FilterData | null>(initialFilterData);

  const popularCategories = [
    {
      title: 'Software Engineer',
      icon: Code,
      count: '1,200+ lowongan',
      color: 'from-blue-500 to-blue-600',
      category: 'Teknologi Informasi'
    },
    {
      title: 'Digital Marketing',
      icon: TrendingUp,
      count: '800+ lowongan',
      color: 'from-green-500 to-green-600',
      category: 'Digital Marketing'
    },
    {
      title: 'Customer Service',
      icon: Users,
      count: '600+ lowongan',
      color: 'from-purple-500 to-purple-600',
      category: 'Customer Service'
    },
    {
      title: 'Human Resources',
      icon: Building,
      count: '400+ lowongan',
      color: 'from-orange-500 to-orange-600',
      category: 'Human Resources'
    },
    {
      title: 'Healthcare',
      icon: Heart,
      count: '500+ lowongan',
      color: 'from-red-500 to-red-600',
      category: 'Healthcare'
    },
    {
      title: 'Accounting',
      icon: Calculator,
      count: '350+ lowongan',
      color: 'from-indigo-500 to-indigo-600',
      category: 'Akuntansi'
    },
    {
      title: 'Sales',
      icon: TrendingUp,
      count: '700+ lowongan',
      color: 'from-pink-500 to-pink-600',
      category: 'Sales'
    },
    {
      title: 'Logistics',
      icon: Truck,
      count: '300+ lowongan',
      color: 'from-teal-500 to-teal-600',
      category: 'Logistik'
    },
    {
      title: 'Education',
      icon: Users,
      count: '250+ lowongan',
      color: 'from-yellow-500 to-yellow-600',
      category: 'Pendidikan'
    }
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword) params.set('search', searchKeyword);
    if (selectedLocation) params.set('location', selectedLocation);
    
    // Navigate to jobs page
    const url = `/lowongan-kerja/?${params.toString()}`;
    router.push(url);
  };

  const handleCategoryClick = (category: string) => {
    const url = `/lowongan-kerja/?category=${encodeURIComponent(category)}`;
    router.push(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleArticleClick = (articleSlug: string) => {
    router.push(`/artikel/${articleSlug}/`);
  };

  const getProvinceOptions = () => {
    if (!filterData) return [];
    return Object.keys(filterData.nexjob_lokasi_provinsi).map(province => ({
      value: province,
      label: province
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Schema Markup */}
      <SchemaMarkup schema={generateWebsiteSchema(settings)} />
      <SchemaMarkup schema={generateOrganizationSchema()} />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Temukan Karir Impianmu
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              {settings.siteDescription}
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Keyword Search */}
                <div className="md:col-span-6 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan skill, posisi, atau perusahaan..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 text-lg"
                  />
                </div>

                {/* Location Select */}
                <div className="md:col-span-4">
                  <SearchableSelect
                    options={getProvinceOptions()}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Semua Provinsi"
                    className="text-lg"
                  />
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Cari
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">10,000+</span>
              <span className="text-primary-100">Lowongan Aktif</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">2,500+</span>
              <span className="text-primary-100">Perusahaan</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 text-center">
              <span className="text-3xl font-bold block">50,000+</span>
              <span className="text-primary-100">Pencari Kerja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Kategori Pekerjaan Populer</h2>
          <p className="text-xl text-gray-600">Temukan pekerjaan berdasarkan kategori yang paling diminati</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <div
                key={index}
                onClick={() => handleCategoryClick(category.category)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-primary-200"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4">{category.count}</p>
                <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  Lihat Lowongan
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Articles Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tips & Panduan Karir</h2>
            <p className="text-xl text-gray-600">Artikel terbaru untuk membantu perjalanan karir Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <article
                key={article.id}
                onClick={() => handleArticleClick(article.slug)}
                className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {article.title.rendered}
                  </h3>
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
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/artikel/"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center"
            >
              Lihat Semua Artikel
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;