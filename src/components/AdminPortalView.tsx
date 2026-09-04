import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Building, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Sliders, 
  FileText, 
  Eye, 
  Layers, 
  Users, 
  ToggleLeft, 
  ToggleRight,
  Send
} from 'lucide-react';
import { AdminMetrics, Booking, Hotel, SettlementRecord, AuditLogRecord, SupportedCurrency } from '../types';
import { Language, translations } from '../lib/i18n';
import { CurrencyService } from '../lib/currency';

interface AdminPortalViewProps {
  lang: Language;
  currency: SupportedCurrency;
  onExitAdmin: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  lang,
  currency,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'BOOKINGS' | 'HOTELS' | 'SETTLEMENTS' | 'AUDIT'>('METRICS');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleHotelId, setSettleHotelId] = useState('');
  const [settleNotes, setSettleNotes] = useState('Weekly B2B bank payout via Russian Central Bank SBP transfer');
  const t = translations[lang];

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes, hRes, sRes, aRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/bookings'),
        fetch('/api/hotels'),
        fetch('/api/admin/settlements'),
        fetch('/api/admin/audit-logs'),
      ]);

      const [mJson, bJson, hJson, sJson, aJson] = await Promise.all([
        mRes.json(),
        bRes.json(),
        hRes.json(),
        sRes.json(),
        aRes.json(),
      ]);

      if (mJson.success) setMetrics(mJson.data);
      if (bJson.success) setBookings(bJson.data);
      if (hJson.success) setHotels(hJson.data);
      if (sJson.success) setSettlements(sJson.data);
      if (aJson.success) setAuditLogs(aJson.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleHotel = async (hotelId: string) => {
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/toggle`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setHotels((prev) =>
          prev.map((h) => (h.id === hotelId ? { ...h, active: json.active } : h))
        );
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleHotelId) return;
    try {
      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: settleHotelId, notes: settleNotes }),
      });
      const json = await res.json();
      if (json.success) {
        setSettleHotelId('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.admin.portalTitle}
            </h1>
            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              OPERATIONS BACKOFFICE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'مراقبة الحجوزات والمدفوعات والمستحقات الفندقية وسجلات التدقيق المحاسبي'
              : 'Production ledger, partner disbursements, inventory controls, and financial reconciliation.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/admin/reports/csv"
            download
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.admin.exportCsv}</span>
          </a>

          <button
            onClick={fetchAdminData}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onExitAdmin}
            className="rounded-xl bg-slate-900 text-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold hover:bg-slate-800 transition"
          >
            {lang === 'ar' ? 'الخروج للمتجر' : 'Exit Admin'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {t.admin.totalRevenue}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {CurrencyService.format(metrics.grossRevenueRub, currency, lang)}
            </div>
            <span className="text-xs text-slate-500 font-mono mt-1 block">
              {metrics.grossRevenueRub.toLocaleString()} ₽ Rubles
            </span>
          </div>

          {/* Platform Commission */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              {t.admin.totalCommission} (12%)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {CurrencyService.format(metrics.platformCommissionRub, currency, lang)}
            </div>
            <span className="text-xs text-slate-500 font-mono mt-1 block">
              {metrics.platformCommissionRub.toLocaleString()} ₽ Gross Profit
            </span>
          </div>

          {/* Total Bookings */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {t.admin.totalBookings}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalBookings}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {bookings.filter((b) => b.status === 'CONFIRMED').length} Confirmed Active
            </span>
          </div>

          {/* Active Partner Hotels */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {t.admin.activeHotels}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {metrics.activeHotelsCount} / {hotels.length}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Direct API & Channel Integrations
            </span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('METRICS')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'METRICS'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.admin.tabOverview}
        </button>
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'BOOKINGS'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.admin.tabBookings} ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('HOTELS')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'HOTELS'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.admin.tabHotels} ({hotels.length})
        </button>
        <button
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'SETTLEMENTS'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.admin.tabSettlements} ({settlements.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 px-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t.admin.tabAudit} ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Overview & Metrics Details */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                {lang === 'ar' ? 'توزيع المدفوعات حسب البوابات' : 'Payment Gateway Distribution'}
              </h3>
              <div className="space-y-3 text-xs">
                {['MADA', 'TAMARA', 'TAP', 'CREDIT_CARD', 'SANDBOX'].map((gateway) => {
                  const gBookings = bookings.filter((b) => b.paymentMethod === gateway);
                  const count = gBookings.length;
                  const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0;
                  return (
                    <div key={gateway} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{gateway}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
                {lang === 'ar' ? 'الوجهات الأكثر طلباً' : 'Top Travel Destinations'}
              </h3>
              <div className="space-y-3 text-xs">
                {['Moscow', 'Saint Petersburg', 'Sochi', 'Kazan', 'Murmansk'].map((cityName) => {
                  const cBookings = bookings.filter((b) => b.hotelCity.toLowerCase().includes(cityName.toLowerCase()));
                  const count = cBookings.length;
                  return (
                    <div key={cityName} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="font-bold">{cityName}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{count} {lang === 'ar' ? 'حجوزات' : 'stays'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bookings Ledger */}
      {activeTab === 'BOOKINGS' && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3.5 text-start">{t.voucher.bookingCode}</th>
                  <th className="p-3.5 text-start">النزيل</th>
                  <th className="p-3.5 text-start">الفندق والمدينة</th>
                  <th className="p-3.5 text-start">تواريخ الإقامة</th>
                  <th className="p-3.5 text-start">المبلغ المدفوع</th>
                  <th className="p-3.5 text-start">البوابة</th>
                  <th className="p-3.5 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {b.bookingCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{b.guests[0]?.fullName || b.userEmail}</div>
                      <div className="text-[10px] text-slate-400">{b.userPhone}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{b.hotelNameEn}</div>
                      <div className="text-[10px] text-slate-400">{b.hotelCity}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{b.checkInDate} → {b.checkOutDate}</div>
                      <div className="text-[10px] text-slate-400">{b.nightsCount} nights</div>
                    </td>
                    <td className="p-3.5 font-bold">
                      <div>{CurrencyService.format(b.totalPriceRub, b.currencyPaid, lang)}</div>
                      <div className="text-[10px] text-slate-400">{b.totalPriceRub.toLocaleString()} ₽</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : b.status === 'CANCELLED'
                          ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Hotels Inventory Controls */}
      {activeTab === 'HOTELS' && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3.5 text-start">الفندق</th>
                  <th className="p-3.5 text-start">المدينة</th>
                  <th className="p-3.5 text-start">النجوم والتقييم</th>
                  <th className="p-3.5 text-start">الغرف المتاحة</th>
                  <th className="p-3.5 text-start">نسبة العمولة</th>
                  <th className="p-3.5 text-start">حالة العرض</th>
                  <th className="p-3.5 text-start">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {hotels.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{h.nameEn}</div>
                      <div className="text-[10px] text-slate-400">{h.nameAr}</div>
                    </td>
                    <td className="p-3.5">{h.city}</td>
                    <td className="p-3.5 font-semibold">
                      ★ {h.stars} • {h.rating} ({h.reviewCount})
                    </td>
                    <td className="p-3.5">{h.rooms.length} room types</td>
                    <td className="p-3.5 font-bold text-emerald-600">{h.commissionRate * 100}%</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {h.active ? 'نشط (Active)' : 'موقف (Paused)'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleHotel(h.id)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {h.active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Partner Settlements */}
      {activeTab === 'SETTLEMENTS' && (
        <div className="space-y-6">
          {/* Create Settlement Trigger Form */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              {lang === 'ar' ? 'تسوية مستحقات فندق شريك جديدة (Disbursement)' : 'Execute Partner Payout'}
            </h3>
            <form onSubmit={handleCreateSettlement} className="flex flex-col sm:flex-row gap-3">
              <select
                value={settleHotelId}
                onChange={(e) => setSettleHotelId(e.target.value)}
                required
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
              >
                <option value="">اختر الفندق الشريك للتحويل...</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nameEn} ({h.city})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                placeholder="ملاحظات التحويل والتحويل البنكي الروسي"
              />

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow transition"
              >
                تنفيذ التسوية
              </button>
            </form>
          </div>

          {/* Settlements Log */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3.5 text-start">رقم التسوية</th>
                  <th className="p-3.5 text-start">الفندق الشريك</th>
                  <th className="p-3.5 text-start">إجمالي الحجوزات</th>
                  <th className="p-3.5 text-start">عمولة المنصة</th>
                  <th className="p-3.5 text-start">صافي المحول للفندق</th>
                  <th className="p-3.5 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{s.id}</td>
                    <td className="p-3.5 font-semibold">{s.hotelName}</td>
                    <td className="p-3.5">{s.totalBookingsAmountRub.toLocaleString()} ₽</td>
                    <td className="p-3.5 font-bold text-amber-600">{s.platformCommissionRub.toLocaleString()} ₽</td>
                    <td className="p-3.5 font-bold text-emerald-600">{s.netPayoutRub.toLocaleString()} ₽</td>
                    <td className="p-3.5 text-[11px] text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
            {lang === 'ar' ? 'سجل الرقابة المحاسبية والأمان (Audit Trail)' : 'Security Audit Log & Activity Trail'}
          </h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 me-2">[{log.action}]</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    By: {log.actor} ({log.actorRole}) • Target: {log.target} ({log.targetId})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
