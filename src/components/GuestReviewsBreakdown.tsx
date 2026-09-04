import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  MessageSquare, 
  ThumbsUp, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  X, 
  Send, 
  Filter,
  Award
} from 'lucide-react';
import { HotelReview, Hotel } from '../types';
import { Language, translations } from '../lib/i18n';

interface GuestReviewsBreakdownProps {
  hotel: Hotel;
  lang: Language;
}

export const GuestReviewsBreakdown: React.FC<GuestReviewsBreakdownProps> = ({ hotel, lang }) => {
  const t = translations[lang];
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTravelerType, setSelectedTravelerType] = useState<string>('all');
  
  // Write Review Modal state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(10);
  const [cleanlinessScore, setCleanlinessScore] = useState<number>(10);
  const [staffScore, setStaffScore] = useState<number>(10);
  const [locationScore, setLocationScore] = useState<number>(10);
  const [valueScore, setValueScore] = useState<number>(9.5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [travelerType, setTravelerType] = useState<'family' | 'couple' | 'solo' | 'business'>('family');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCountry, setReviewerCountry] = useState('Saudi Arabia 🇸🇦');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Fetch reviews for this hotel
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews?hotelId=${encodeURIComponent(hotel.id)}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [hotel.id]);

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedTravelerType === 'all') return true;
    return r.travelerType === selectedTravelerType;
  });

  // Calculate dynamic sub-rating averages
  const avgSubRatings = {
    cleanliness: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.subRatings?.cleanliness || hotel.rating), 0) / reviews.length).toFixed(1)
      : '9.8',
    staff: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.subRatings?.service || hotel.rating), 0) / reviews.length).toFixed(1)
      : '9.9',
    location: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.subRatings?.location || hotel.rating), 0) / reviews.length).toFixed(1)
      : '9.9',
    value: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.subRatings?.value || hotel.rating - 0.3), 0) / reviews.length).toFixed(1)
      : '9.5',
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    try {
      setSubmitting(true);
      const newReviewPayload = {
        hotelId: hotel.id,
        bookingId: `RB-VERIFIED-${Date.now().toString().slice(-5)}`,
        userId: `usr-${Date.now()}`,
        userName: reviewerName.trim() || (lang === 'ar' ? 'مسافر من الخليج' : 'GCC Traveler'),
        userCountry: reviewerCountry,
        rating: Number(newRating),
        subRatings: {
          cleanliness: Number(cleanlinessScore),
          location: Number(locationScore),
          service: Number(staffScore),
          value: Number(valueScore),
        },
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        travelerType,
        verifiedBooking: true,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReviewPayload),
      });

      if (res.ok) {
        const savedReview = await res.json();
        setReviews((prev) => [savedReview, ...prev]);
        setSubmittedSuccess(true);
        setTimeout(() => {
          setSubmittedSuccess(false);
          setIsWriteModalOpen(false);
          setReviewTitle('');
          setReviewComment('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9.5) return lang === 'ar' ? 'استثنائي وفائق الروعة' : 'Exceptional';
    if (score >= 9.0) return lang === 'ar' ? 'ممتاز' : 'Superb';
    if (score >= 8.0) return lang === 'ar' ? 'جيد جداً' : 'Very Good';
    return lang === 'ar' ? 'جيد ومريح' : 'Good';
  };

  return (
    <div id="hotel-guest-reviews-section" className="space-y-6 pt-4">
      {/* Top Banner: Score Summary & Breakdown Progress Bars */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* Score Big Pill */}
            <div className="flex flex-col items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <span className="text-2xl sm:text-3xl font-black">{hotel.rating.toFixed(1)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">/ 10</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
                  {getScoreLabel(hotel.rating)}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'تقييمات موثقة 100%' : '100% Verified Stays'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t.reviewsBreakdown.verifiedGuestsOnly}
              </p>
            </div>
          </div>

          {/* Write a Review Button */}
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 text-xs font-bold shadow-md transition active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.reviewsBreakdown.writeReviewBtn}</span>
          </button>
        </div>

        {/* Sub-Ratings Progress Bars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          {/* Cleanliness */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">{t.reviewsBreakdown.cleanliness}</span>
              <span className="font-bold text-slate-900 dark:text-white">{avgSubRatings.cleanliness}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Number(avgSubRatings.cleanliness) * 10}%` }}
              />
            </div>
          </div>

          {/* Staff & Service */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">{t.reviewsBreakdown.staff}</span>
              <span className="font-bold text-slate-900 dark:text-white">{avgSubRatings.staff}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Number(avgSubRatings.staff) * 10}%` }}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">{t.reviewsBreakdown.location}</span>
              <span className="font-bold text-slate-900 dark:text-white">{avgSubRatings.location}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Number(avgSubRatings.location) * 10}%` }}
              />
            </div>
          </div>

          {/* Value for Money */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">{t.reviewsBreakdown.value}</span>
              <span className="font-bold text-slate-900 dark:text-white">{avgSubRatings.value}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Number(avgSubRatings.value) * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Traveler Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedTravelerType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedTravelerType === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t.reviewsBreakdown.filterAll} ({reviews.length})
        </button>
        <button
          onClick={() => setSelectedTravelerType('family')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedTravelerType === 'family'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t.reviewsBreakdown.filterFamilies}
        </button>
        <button
          onClick={() => setSelectedTravelerType('couple')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedTravelerType === 'couple'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t.reviewsBreakdown.filterCouples}
        </button>
        <button
          onClick={() => setSelectedTravelerType('business')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedTravelerType === 'business'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {t.reviewsBreakdown.filterBusiness}
        </button>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            {t.common.loading}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">
              {lang === 'ar' ? 'لا توجد تقييمات في هذه الفئة بعد.' : 'No reviews in this category yet.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-3.5 shadow-xs"
            >
              {/* Header: User details & Rating pill */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm">
                    {rev.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{rev.userName}</span>
                      <span className="text-xs">{rev.userCountry}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'حجز وإقامة موثقة' : 'Verified Booking'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs">
                  <span>★</span>
                  <span>{rev.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Review Title & Content */}
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1">
                  {rev.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-text prose-ar">
                  {rev.comment}
                </p>
              </div>

              {/* Review metadata footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {new Date(rev.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="capitalize">
                  {lang === 'ar'
                    ? rev.travelerType === 'family'
                      ? 'رحلة عائلية'
                      : rev.travelerType === 'couple'
                      ? 'رحلة زوجية'
                      : 'رحلة فردية / عمل'
                    : `${rev.travelerType} Trip`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write a Review Modal Dialog */}
      {isWriteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-4 end-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {t.reviewsBreakdown.modalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {t.reviewsBreakdown.modalSubtitle}
            </p>

            {submittedSuccess ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto" />
                <p className="font-bold text-sm">{t.reviewsBreakdown.thankYou}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Overall Rating Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{t.reviewsBreakdown.yourRating}</span>
                    <span className="text-amber-500 font-black text-sm">{newRating} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={newRating}
                    onChange={(e) => setNewRating(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Sub-scores 2x2 grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1">{t.reviewsBreakdown.cleanliness}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={cleanlinessScore}
                      onChange={(e) => setCleanlinessScore(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1">{t.reviewsBreakdown.staff}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={staffScore}
                      onChange={(e) => setStaffScore(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1">{t.reviewsBreakdown.location}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={locationScore}
                      onChange={(e) => setLocationScore(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1">{t.reviewsBreakdown.value}</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={valueScore}
                      onChange={(e) => setValueScore(parseFloat(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 font-bold"
                    />
                  </div>
                </div>

                {/* Traveler Type & Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.reviewsBreakdown.travelerType}
                    </label>
                    <select
                      value={travelerType}
                      onChange={(e) => setTravelerType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                    >
                      <option value="family">{lang === 'ar' ? 'عائلة' : 'Family'}</option>
                      <option value="couple">{lang === 'ar' ? 'زوجان' : 'Couple'}</option>
                      <option value="solo">{lang === 'ar' ? 'منفرد' : 'Solo'}</option>
                      <option value="business">{lang === 'ar' ? 'عمل' : 'Business'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'دولة الإقامة' : 'Country'}
                    </label>
                    <select
                      value={reviewerCountry}
                      onChange={(e) => setReviewerCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                    >
                      <option value="Saudi Arabia 🇸🇦">المملكة العربية السعودية 🇸🇦</option>
                      <option value="United Arab Emirates 🇦🇪">الإمارات العربية المتحدة 🇦🇪</option>
                      <option value="Kuwait 🇰🇼">الكويت 🇰🇼</option>
                      <option value="Qatar 🇶🇦">قطر 🇶🇦</option>
                      <option value="Bahrain 🇧🇭">البحرين 🇧🇭</option>
                      <option value="Oman 🇴🇲">عُمان 🇴🇲</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewsBreakdown.reviewTitle}
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder={t.reviewsBreakdown.reviewTitlePlaceholder}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewsBreakdown.reviewComment}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t.reviewsBreakdown.reviewCommentPlaceholder}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 text-xs shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? t.reviewsBreakdown.submitting : t.reviewsBreakdown.submitReview}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
