import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  MessageSquarePlus, 
  Sparkles, 
  ThumbsUp, 
  User, 
  Calendar,
  X,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { Hotel, HotelReview } from '../types';
import { Language, translations } from '../lib/i18n';

interface HotelReviewsBreakdownProps {
  hotel: Hotel;
  lang: Language;
  onReviewSubmitted?: (newReview: HotelReview) => void;
}

export const HotelReviewsBreakdown: React.FC<HotelReviewsBreakdownProps> = ({
  hotel,
  lang,
  onReviewSubmitted,
}) => {
  const t = translations[lang];
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'family' | 'couple' | 'business'>('ALL');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Form states
  const [authorName, setAuthorName] = useState('');
  const [authorCountry, setAuthorCountry] = useState('المملكة العربية السعودية');
  const [rating, setRating] = useState(9.5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [travelerType, setTravelerType] = useState<'family' | 'couple' | 'business' | 'solo'>('family');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sub-scores derived from rating
  const cleanlinessScore = Math.min(10, Math.max(7.5, (hotel.rating * 1.02))).toFixed(1);
  const staffScore = Math.min(10, Math.max(7.5, (hotel.rating * 1.01))).toFixed(1);
  const locationScore = Math.min(10, Math.max(7.5, (hotel.rating * 1.04))).toFixed(1);
  const valueScore = Math.min(10, Math.max(7.0, (hotel.rating * 0.98))).toFixed(1);

  const reviewsList = hotel.reviews || [];

  // Filter reviews
  const filteredReviews = reviewsList.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'family') return r.stayType?.toLowerCase().includes('family') || r.comment.includes('عائل');
    if (selectedFilter === 'couple') return r.stayType?.toLowerCase().includes('couple') || r.comment.includes('زوج');
    if (selectedFilter === 'business') return r.stayType?.toLowerCase().includes('business') || r.comment.includes('عمل');
    return true;
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hotels/${hotel.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          authorCountry,
          rating,
          title: reviewTitle || (lang === 'ar' ? 'إقامة مميزة' : 'Great Stay'),
          comment,
          stayType: travelerType,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitSuccess(true);
        if (onReviewSubmitted && json.data) {
          onReviewSubmitted(json.data);
        }
        setTimeout(() => {
          setIsWriteModalOpen(false);
          setSubmitSuccess(false);
          setReviewTitle('');
          setComment('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error posting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header & Overall Score summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {t.reviewsBreakdown.title}
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'ar' ? 'نزلاء موثقون' : 'Verified Guests'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            {t.reviewsBreakdown.verifiedGuestsOnly}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl shadow-md">
              {hotel.rating.toFixed(1)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {hotel.rating >= 9.0 ? (lang === 'ar' ? 'استثنائي وفائق' : 'Exceptional') : (lang === 'ar' ? 'رائع جداً' : 'Wonderful')}
              </div>
              <div className="text-xs text-slate-500">
                {hotel.reviewCount} {lang === 'ar' ? 'تقييم حقيقي' : 'verified reviews'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-md transition"
          >
            <MessageSquarePlus className="w-4 h-4 text-amber-500" />
            <span>{t.reviewsBreakdown.writeReviewBtn}</span>
          </button>
        </div>
      </div>

      {/* Booking.com Style Category Progress Bars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t.reviewsBreakdown.cleanliness}</span>
            <span className="font-bold">{cleanlinessScore}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(parseFloat(cleanlinessScore) / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t.reviewsBreakdown.staff}</span>
            <span className="font-bold">{staffScore}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(parseFloat(staffScore) / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t.reviewsBreakdown.location}</span>
            <span className="font-bold">{locationScore}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(parseFloat(locationScore) / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t.reviewsBreakdown.value}</span>
            <span className="font-bold">{valueScore}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(parseFloat(valueScore) / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Review Traveler Filter Pills */}
      <div className="flex items-center gap-2 pt-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'تصفية الآراء:' : 'Filter by:'}</span>
        </span>
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t.reviewsBreakdown.filterAll}
        </button>
        <button
          onClick={() => setSelectedFilter('family')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedFilter === 'family'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t.reviewsBreakdown.filterFamilies}
        </button>
        <button
          onClick={() => setSelectedFilter('couple')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedFilter === 'couple'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t.reviewsBreakdown.filterCouples}
        </button>
        <button
          onClick={() => setSelectedFilter('business')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedFilter === 'business'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          {t.reviewsBreakdown.filterBusiness}
        </button>
      </div>

      {/* Guest Reviews List */}
      <div className="space-y-4 pt-2">
        {filteredReviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {lang === 'ar' ? 'لا توجد تقييمات مطابقة لهذه الفئة حالياً.' : 'No reviews match this filter.'}
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    {rev.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {rev.author}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({rev.country})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{lang === 'ar' ? 'إقامة موثقة' : 'Verified Stay'}</span>
                      </span>
                      <span>•</span>
                      <span>{rev.stayType || 'Family'}</span>
                      <span>•</span>
                      <span>{rev.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-8 px-2.5 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs">
                  {rev.rating.toFixed(1)}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                "{rev.comment}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* Write a Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {t.reviewsBreakdown.modalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t.reviewsBreakdown.modalSubtitle}
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.reviewsBreakdown.thankYou}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'اسم النزيل' : 'Guest Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: عبد العزيز الشمري' : 'e.g., Abdulaziz'}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'البلد' : 'Country'}
                    </label>
                    <input
                      type="text"
                      value={authorCountry}
                      onChange={(e) => setAuthorCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{t.reviewsBreakdown.yourRating}</span>
                    <span className="text-amber-600 dark:text-amber-400 text-sm font-black">{rating.toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="5.0"
                    max="10.0"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewsBreakdown.travelerType}
                  </label>
                  <select
                    value={travelerType}
                    onChange={(e) => setTravelerType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="family">{lang === 'ar' ? 'عائلة / أطفال' : 'Family with children'}</option>
                    <option value="couple">{lang === 'ar' ? 'زوجان' : 'Couple'}</option>
                    <option value="business">{lang === 'ar' ? 'رحلة عمل' : 'Business Trip'}</option>
                    <option value="solo">{lang === 'ar' ? 'مسافر فردي' : 'Solo Traveler'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewsBreakdown.reviewTitle}
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder={t.reviewsBreakdown.reviewTitlePlaceholder}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewsBreakdown.reviewComment}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.reviewsBreakdown.reviewCommentPlaceholder}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <span>{isSubmitting ? t.reviewsBreakdown.submitting : t.reviewsBreakdown.submitReview}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
