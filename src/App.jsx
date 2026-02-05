import React, { useState, useEffect } from 'react';
import AvailabilityTable from './components/AvailabilityTable';
import { Bike, RefreshCw, Filter, TrendingUp } from 'lucide-react';

function App() {
    const [data, setData] = useState(null);
    const [bikes, setBikes] = useState([]);
    const [globalSettings, setGlobalSettings] = useState(null);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(1); // Default to 1 day
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
    const [loadingStatus, setLoadingStatus] = useState({
        loaded: 0,
        total: 0,
        isComplete: false
    });

    useEffect(() => {
        // Fetch example.json and then aggregate availability data
        async function loadData() {
            try {
                // Fetch the example.json file
                const exampleResponse = await fetch('/example.json');
                const exampleData = await exampleResponse.json();

                // Fetch product images first
                const { fetchProductImages, extractBikeMetadata, fetchBookingsProgressively } = await import('./utils/dataFetcher');
                const imageMap = await fetchProductImages();

                // Extract bike metadata immediately (synchronous)
                const initialData = extractBikeMetadata(exampleData, imageMap);

                // Set initial state - table will appear immediately
                setBikes(initialData.bikes);
                setGlobalSettings(initialData.globalSettings);
                setData({ lastUpdated: initialData.lastUpdated });
                setLoadingStatus({ loaded: 0, total: initialData.bikes.length, isComplete: false });

                // Fetch bookings progressively
                fetchBookingsProgressively(initialData.bikes, {
                    onBikeUpdate: (variantId, bookingData) => {
                        setBikes(prevBikes =>
                            prevBikes.map(bike =>
                                bike.variantId === variantId
                                    ? { ...bike, ...bookingData }
                                    : bike
                            )
                        );
                    },
                    onProgress: (progressInfo) => {
                        setLoadingStatus({
                            loaded: progressInfo.current,
                            total: progressInfo.total,
                            isComplete: false
                        });
                    },
                    onComplete: () => {
                        setLoadingStatus(prev => ({ ...prev, isComplete: true }));
                        setData(prevData => ({ ...prevData, lastUpdated: new Date().toISOString() }));
                    }
                });

            } catch (err) {
                console.error('Failed to load availability data:', err);
                setError('Failed to load data. Please ensure example.json is in the public folder.');
            }
        }

        loadData();
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
                <div className="glass-card p-8 max-w-md text-center">
                    <XCircle className="text-status-booked mx-auto mb-4" size={48} />
                    <h2 className="text-xl font-bold mb-2">Initialization Error</h2>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                    <code className="block bg-slate-900 p-3 rounded text-xs text-left mb-6">
                        node scripts/data-fetcher.js
                    </code>
                </div>
            </div>
        );
    }

    // Show table even if bikes aren't fully loaded yet
    const hasData = bikes.length > 0 && globalSettings && data;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-header px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/20">
                                <Bike className="text-white" size={24} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                Fleet Availability Tracker
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {!loadingStatus.isComplete && hasData ? (
                                <>
                                    <RefreshCw className="text-emerald-500 animate-spin" size={14} />
                                    <p className="text-slate-400 font-medium text-sm">
                                        Syncing availability: {loadingStatus.loaded}/{loadingStatus.total} bikes
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-slate-400 font-medium">
                                        Live synchronization with Xpert Moto fleet
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Price Duration</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="glass-card bg-slate-900/50 border-white/10 text-white text-sm px-4 py-2 rounded-lg outline-none focus:border-red-500/50 transition-colors cursor-pointer"
                        >
                            <option value={1}>1 Day</option>
                            <option value={2}>2 Days</option>
                            <option value={3}>3 Days</option>
                            <option value={7}>1 Week</option>
                            <option value={14}>2 Weeks</option>
                            <option value={21}>3 Weeks</option>
                            <option value={28}>4 Weeks</option>
                        </select>
                    </div>
                </div>
            </header>

            {hasData && (
                <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Bike Availability</h2>
                            <p className="text-slate-400 text-sm mt-1">Live status for the next 30 days across technical variants.</p>
                        </div>
                    </div>

                    <AvailabilityTable
                        bikes={bikes}
                        globalSettings={globalSettings}
                        duration={duration}
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                    />

                    <footer className="py-8 text-center border-t border-white/5">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                            Dashboard generated at {new Date(data.lastUpdated).toLocaleString()}
                        </p>
                    </footer>
                </main>
            )}
        </div>
    );
}

export default App;
