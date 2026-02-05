import React, { useMemo } from 'react';
import { format, addDays, isSameDay, parseISO, getDay } from 'date-fns';
import { clsx } from 'clsx';
import { Calendar, Info, CheckCircle2, XCircle, Clock, Bike, TrendingUp } from 'lucide-react';

const AvailabilityTable = ({ data, duration, sortOrder, onSortChange, days = 30 }) => {
    const dates = useMemo(() => {
        return Array.from({ length: days }).map((_, i) => addDays(new Date(), i));
    }, [days]);

    const getStatus = (bike, date) => {
        const yearMonthDay = format(date, 'yyyy/MM/dd');
        const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

        // 1. Check Global Closures (Sundays + Holidays)
        const year = format(date, 'yyyy');
        const month = (date.getMonth() + 1).toString();
        const dayNumeric = date.getDate();

        // Check global holiday list
        const isHoliday = data.globalSettings.disabledDatesGlobal[year]?.[month]?.includes(dayNumeric);
        const isStoreClosed = data.globalSettings.closures.includes(dayOfWeek) || isHoliday;

        // 2. Check Bookings
        // Response keys can be "2026/02/27", "2026/02/27_start", or "2026/02/27_end"
        const isBooked = bike.bookings && (
            bike.bookings[yearMonthDay] ||
            bike.bookings[`${yearMonthDay}_start`] ||
            bike.bookings[`${yearMonthDay}_end`]
        );

        // 3. Check Half-day (Saturday)
        const isHalfDay = dayOfWeek === 6;

        if (isBooked) return 'booked';
        if (isStoreClosed) return 'closed';
        if (isHalfDay) return 'half';
        return 'available';
    };

    const getPriceForDuration = (bike, days) => {
        if (!bike.pricing || bike.pricing.length === 0) return 0;

        // Find the applicable price tier
        const tier = bike.pricing.find(p => {
            if (p.days === 'default') return false;
            const from = parseInt(p.days);
            const to = p.to === 'default' ? Infinity : parseInt(p.to);
            return days >= from && days <= to;
        });

        if (tier) {
            const tierPrice = parseFloat(tier.price);
            const tierStart = parseInt(tier.days);

            // For weekly pricing (7+ days), the price is per week
            if (tierStart >= 7) {
                const weeks = days / 7;
                return tierPrice * weeks;
            }

            // For daily pricing (< 7 days), price is total for the tier
            return tierPrice;
        }

        // Fallback to default price
        const defaultTier = bike.pricing.find(p => p.days === 'default');
        if (defaultTier) {
            const defaultPrice = parseFloat(defaultTier.price);
            // Assume default is daily rate
            return defaultPrice * days;
        }

        return 0;
    };

    const sortedBikes = useMemo(() => {
        return [...data.availability].sort((a, b) => {
            if (sortOrder === 'asc' || sortOrder === 'desc') {
                const priceA = getPriceForDuration(a, duration);
                const priceB = getPriceForDuration(b, duration);
                return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
            }
            return a.name.localeCompare(b.name);
        });
    }, [data.availability, duration, sortOrder]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-500/20 hover:bg-emerald-500/40';
            case 'booked':
                return 'bg-red-500/20 hover:bg-red-500/40';
            case 'closed':
                return 'bg-orange-500/20 hover:bg-orange-500/40';
            case 'half':
                return 'bg-yellow-500/20 hover:bg-yellow-500/40';
            default:
                return 'bg-slate-700/20 hover:bg-slate-700/40';
        }
    };

    const toggleSort = () => {
        onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50">
                            <th className="sticky left-0 z-20 bg-slate-900 p-4 text-left border-r border-white/10 min-w-[250px]">
                                <div className="flex items-center gap-2 text-slate-400 font-medium text-xs uppercase tracking-wider">
                                    <Bike size={14} />
                                    Motorcycle
                                </div>
                            </th>
                            <th className="sticky left-[250px] z-20 bg-slate-900 p-4 text-left border-r border-white/10 min-w-[120px]">
                                <button
                                    onClick={toggleSort}
                                    className="flex items-center gap-2 text-slate-400 font-medium text-xs uppercase tracking-wider hover:text-white transition-colors"
                                >
                                    Pricing
                                    <TrendingUp size={14} className={clsx(sortOrder === 'desc' && "rotate-180", "transition-transform")} />
                                </button>
                            </th>
                            {dates.map((date) => (
                                <th key={date.toISOString()} className="p-2 border-r border-white/5 min-w-[50px] text-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">{format(date, 'EEE')}</div>
                                    <div className="text-sm font-bold">{format(date, 'dd')}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBikes.map((bike) => (
                            <tr key={bike.variantId} className="hover:bg-white/5 group border-b border-white/5 last:border-0">
                                <td className="sticky left-0 z-20 bg-slate-950/90 backdrop-blur-md p-4 border-r border-white/10 group-hover:bg-slate-900/95 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {bike.imageUrl && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-slate-900">
                                                <img
                                                    src={bike.imageUrl}
                                                    alt={bike.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-sm truncate max-w-[150px]" title={bike.name}>{bike.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="px-1 py-0.5 rounded border border-white/10 bg-white/5 font-mono">ID: {bike.variantId.slice(-4)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="sticky left-[250px] z-20 bg-slate-950/90 backdrop-blur-md p-4 border-r border-white/10 group-hover:bg-slate-900/95 transition-colors">
                                    <div className="text-sm font-bold text-emerald-400">
                                        ${getPriceForDuration(bike, duration).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        Total for {duration} {duration === 1 ? 'day' : 'days'}
                                    </div>
                                </td>
                                {dates.map((date) => {
                                    const status = getStatus(bike, date);
                                    return (
                                        <td
                                            key={date.toISOString()}
                                            className={clsx(
                                                "p-0 border-r border-white/5",
                                            )}
                                        >
                                            <div
                                                className={clsx(
                                                    "w-full h-10 transition-colors duration-200 cursor-help",
                                                    getStatusColor(status)
                                                )}
                                                title={`${bike.name}\n${format(date, 'PPPP')}\nStatus: ${status.replace(/^\w/, c => c.toUpperCase())}`}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="p-6 bg-slate-900/50 border-t border-white/10 flex flex-wrap gap-8 items-center justify-center sm:justify-start">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded status-available ring-1 ring-white/10 shadow-lg shadow-emerald-500/10"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded status-booked ring-1 ring-white/10 shadow-lg shadow-red-500/10"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booked</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded status-closed ring-1 ring-white/10 shadow-lg shadow-orange-500/10"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shop Closed</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded status-half ring-1 ring-white/10 shadow-lg shadow-yellow-500/10"></div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Half Day</span>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityTable;
