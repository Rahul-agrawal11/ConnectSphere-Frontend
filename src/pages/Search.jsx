import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
    Search as SearchIcon, Users, Hash, FileText, TrendingUp,
    UserPlus, UserMinus, Loader2,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';
import {
    searchUsers,
    searchUsersDirectly,
    searchPosts,
    searchHashtags,
    getTrendingHashtags,
    getPostsByHashtag,
    getPostById,
} from '../api/searchApi';
import { follow, unfollow, isFollowing } from '../api/followApi';
import { useToast } from '../components/common/Toast';
import './Search.css';

const TABS = [
    { key: 'posts', label: 'Posts', icon: <FileText size={15} /> },
    { key: 'people', label: 'People', icon: <Users size={15} /> },
    { key: 'hashtags', label: 'Hashtags', icon: <Hash size={15} /> },
];

/**
 * extractList — safely converts any backend response body into a plain JS array.
 *
 * Handles all shapes the search-service can return:
 *   Shape A — single wrap:   { success, message, data: [...] }
 *   Shape B — single wrap:   { success, message, data: { content: [...] } }  (Page)
 *   Shape C — double wrap:   { success, message, data: { success, message, data: [...] } }
 *   Shape D — raw array:     [ {...}, {...} ]
 *   Shape E — raw Page:      { content: [...], totalPages, ... }
 */
const extractList = (axiosResponseBody) => {
    if (!axiosResponseBody) return [];

    // Debug: log what we actually receive (remove after confirming fixed)
    console.debug('[extractList] raw body:', axiosResponseBody);

    const unwrap = (val) => {
        if (!val) return null;
        // If it's already an array, done
        if (Array.isArray(val)) return val;
        // Spring Page object
        if (typeof val === 'object' && Array.isArray(val.content)) return val.content;
        // ApiResponse wrapper — peel it
        if (
            typeof val === 'object' &&
            'data' in val &&
            ('success' in val || 'message' in val || 'status' in val)
        ) {
            return unwrap(val.data);   // recurse — handles double-wrap
        }
        return null;
    };

    const result = unwrap(axiosResponseBody);
    console.debug('[extractList] extracted:', result);
    return Array.isArray(result) ? result : [];
};

const Search = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQuery = searchParams.get('q') || '';
    const initialTag = searchParams.get('tag') || '';

    const [query, setQuery] = useState(initialQuery || (initialTag ? `#${initialTag}` : ''));
    const [tab, setTab] = useState(initialTag ? 'hashtags' : 'posts');
    const [loading, setLoading] = useState(false);

    const [posts, setPosts] = useState([]);
    const [people, setPeople] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [trending, setTrending] = useState([]);
    const [tagPosts, setTagPosts] = useState([]);
    const [selectedTag, setSelectedTag] = useState(initialTag || '');

    const [followMap, setFollowMap] = useState({});
    const [followLoading, setFollowLoading] = useState({});

    const inputRef = useRef(null);

    // Load trending on mount
    useEffect(() => {
        getTrendingHashtags(12)
            .then((r) => setTrending(extractList(r.data)))
            .catch(() => { });
    }, []);

    // Handle URL tag param
    useEffect(() => {
        if (initialTag) {
            setSelectedTag(initialTag);
            setTab('hashtags');
            loadTagPosts(initialTag);
        } else if (initialQuery) {
            runSearch(initialQuery);
        }
        inputRef.current?.focus();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();

        const q = query.trim();
        if (!q) return;

        if (q.startsWith('#')) {
            const tag = q.slice(1).trim().toLowerCase();

            setSelectedTag('');
            setTagPosts([]);
            setHashtags([]);
            setTab('hashtags');
            setSearchParams({ q });

            try {
                setLoading(true);

                const tagRes = await searchHashtags(tag);
                const tagList = extractList(tagRes.data);

                setHashtags(tagList);

                const exactTag = tagList.find((h) => h.tag?.toLowerCase() === tag);

                if (exactTag) {
                    setSelectedTag(exactTag.tag);
                    setSearchParams({ tag: exactTag.tag });
                    await loadTagPosts(exactTag.tag);
                }
            } catch (err) {
                console.error('Hashtag search error:', err);
                setHashtags([]);
                setTagPosts([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSelectedTag('');
            setTagPosts([]);
            setSearchParams({ q });
            runSearch(q);
        }
    };

    const runSearch = async (q) => {
        setLoading(true);
        // Reset all results before new search
        setPosts([]);
        setPeople([]);
        setHashtags([]);

        try {
            const [postsRes, peopleRes, tagsRes] = await Promise.allSettled([
                searchPosts(q),
                searchUsers(q),
                searchHashtags(q),
            ]);

            const postsList = postsRes.status === 'fulfilled' ? extractList(postsRes.value.data) : [];
            let ppl = peopleRes.status === 'fulfilled' ? extractList(peopleRes.value.data) : [];
            const tagsList = tagsRes.status === 'fulfilled' ? extractList(tagsRes.value.data) : [];

            // Log rejections for debugging
            if (postsRes.status === 'rejected') console.error('Posts search failed:', postsRes.reason);
            if (peopleRes.status === 'rejected') console.error('People search failed:', peopleRes.reason);
            if (tagsRes.status === 'rejected') console.error('Tags search failed:', tagsRes.reason);

            // Fallback: if search-service returned 0 people, call auth-service directly
            if (ppl.length === 0) {
                try {
                    const directRes = await searchUsersDirectly(q);
                    const directList = extractList(directRes.data);
                    if (directList.length > 0) {
                        console.debug('[Search] Used direct auth-service fallback, found:', directList.length);
                        ppl = directList;
                    }
                } catch (fallbackErr) {
                    console.error('Direct user search also failed:', fallbackErr);
                }
            }

            setPosts(postsList);
            setPeople(ppl);
            setHashtags(tagsList);

            // Auto-switch to People tab if no posts but people found
            if (postsList.length === 0 && ppl.length > 0) {
                setTab('people');
            } else if (postsList.length === 0 && ppl.length === 0 && tagsList.length > 0) {
                setTab('hashtags');
            }

            // Check follow status for each person
            if (user && ppl.length > 0) {
                const map = {};
                await Promise.all(
                    ppl.map(async (p) => {
                        try {
                            const r = await isFollowing(p.id);
                            map[p.id] = r.data.data;
                        } catch {
                            map[p.id] = false;
                        }
                    })
                );
                setFollowMap(map);
            }
        } catch (err) {
            console.error('Search error:', err);
        }
        setLoading(false);
    };

    const loadTagPosts = async (tag) => {
        setLoading(true);
        setTagPosts([]);

        try {
            const cleanTag = tag.replace('#', '').trim().toLowerCase();

            const res = await getPostsByHashtag(cleanTag);

            const postIds = extractList(res.data);

            const fullPosts = await Promise.all(
                postIds.map((id) =>
                    getPostById(id)
                        .then((r) => r.data.data)
                        .catch(() => null)
                )
            );

            setTagPosts(fullPosts.filter(Boolean));
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Tag posts error:', err);
            }
            setTagPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetId) => {
        if (!user) { addToast('Please log in to follow', 'info'); return; }
        setFollowLoading((p) => ({ ...p, [targetId]: true }));
        try {
            if (followMap[targetId]) {
                await unfollow(targetId);
                setFollowMap((m) => ({ ...m, [targetId]: false }));
                addToast('Unfollowed', 'info');
            } else {
                await follow(targetId);
                setFollowMap((m) => ({ ...m, [targetId]: true }));
                addToast('Following!', 'success');
            }
        } catch (err) {
            addToast(err.response?.data?.message || 'Action failed', 'error');
        }
        setFollowLoading((p) => ({ ...p, [targetId]: false }));
    };

    const handleTrendingClick = (tag) => {
        const cleanTag = tag.replace('#', '').trim().toLowerCase();

        setQuery(`#${cleanTag}`);
        setSelectedTag(cleanTag);
        setTab('hashtags');
        loadTagPosts(cleanTag);
        setSearchParams({ tag: cleanTag });
    };

    const hasResults = posts.length > 0 || people.length > 0 || hashtags.length > 0;
    const searched = searchParams.get('q') || searchParams.get('tag');

    return (
        <div className="search-page animate-fade-in">
            {/* Search bar */}
            <form className="search-bar card" onSubmit={handleSearch}>
                <SearchIcon size={20} className="search-bar__icon" />
                <input
                    ref={inputRef}
                    className="search-bar__input"
                    placeholder="Search posts, people or #hashtags…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                />
                <button type="submit" className="btn btn-primary btn-sm search-bar__btn">
                    Search
                </button>
            </form>

            {/* Trending section (shown when no search) */}
            {!searched && (
                <div className="search-trending card">
                    <h3 className="search-trending__title">
                        <TrendingUp size={16} /> Trending Hashtags
                    </h3>
                    {trending.length === 0 ? (
                        <p className="search-trending__empty">No trends right now</p>
                    ) : (
                        <div className="search-trending__grid">
                            {trending.map((h) => (
                                <button
                                    key={h.id}
                                    className="search-trend-pill"
                                    onClick={() => handleTrendingClick(h.tag)}
                                >
                                    <span className="search-trend-pill__tag">#{h.tag}</span>
                                    <span className="search-trend-pill__count">{h.postCount || 0} posts</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {searched && (
                <>
                    {/* Tabs */}
                    <div className="search-tabs">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                className={`search-tab ${tab === t.key ? 'search-tab--active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.icon} {t.label}
                                {t.key === 'posts' && posts.length > 0 && <span className="search-tab__count">{posts.length}</span>}
                                {t.key === 'people' && people.length > 0 && <span className="search-tab__count">{people.length}</span>}
                                {t.key === 'hashtags' && hashtags.length > 0 && <span className="search-tab__count">{hashtags.length}</span>}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="search-loading"><Spinner size={36} /></div>
                    ) : (
                        <div className="search-results">
                            {/* Posts tab */}
                            {tab === 'posts' && (
                                <div className="search-results__posts">
                                    {selectedTag ? (
                                        tagPosts.length === 0 ? (
                                            <SearchEmpty label={`#${selectedTag}`} />
                                        ) : (
                                            tagPosts.map((p) => (
                                                <PostCard key={p.id} post={p} />
                                            ))
                                        )
                                    ) : posts.length === 0 ? (
                                        <SearchEmpty label={query} />
                                    ) : (
                                        posts.map((p) => <PostCard key={p.id} post={p} />)
                                    )}
                                </div>
                            )}

                            {/* People tab */}
                            {tab === 'people' && (
                                <div className="search-results__people card">
                                    {people.length === 0 ? (
                                        <SearchEmpty label={query} />
                                    ) : (
                                        people.map((p) => (
                                            <div key={p.id} className="search-person-item">
                                                <Link
                                                    to={`/profile/${p.id}`}
                                                    className="search-person-item__info"
                                                >
                                                    <Avatar
                                                        src={p.profilePicUrl}
                                                        username={p.username}
                                                        size={46}
                                                    />
                                                    <div className="search-person-item__text">
                                                        <span className="search-person-item__name">
                                                            {p.fullName || p.username}
                                                        </span>
                                                        <span className="search-person-item__handle">
                                                            @{p.username}
                                                        </span>
                                                        {p.bio && (
                                                            <span className="search-person-item__bio">{p.bio}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                                {user && user.id !== p.id && (
                                                    <button
                                                        className={`btn btn-sm ${followMap[p.id] ? 'btn-outline' : 'btn-primary'}`}
                                                        onClick={() => handleFollow(p.id)}
                                                        disabled={followLoading[p.id]}
                                                    >
                                                        {followLoading[p.id] ? (
                                                            <Spinner size={14} />
                                                        ) : followMap[p.id] ? (
                                                            <><UserMinus size={14} /> Unfollow</>
                                                        ) : (
                                                            <><UserPlus size={14} /> Follow</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Hashtags tab */}
                            {tab === 'hashtags' && (
                                <div className="search-results__hashtags card">
                                    {!selectedTag && hashtags.length === 0 ? (
                                        <SearchEmpty label={query} />
                                    ) : !selectedTag ? (
                                        hashtags.map((h) => (
                                            <button
                                                key={h.id}
                                                className="search-hashtag-item"
                                                onClick={() => handleTrendingClick(h.tag)}
                                            >
                                                <span className="search-hashtag-item__symbol">#</span>
                                                <div className="search-hashtag-item__info">
                                                    <span className="search-hashtag-item__tag">{h.tag}</span>
                                                    <span className="search-hashtag-item__count">
                                                        {h.postCount || 0} posts
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="search-tag-header">
                                            <div className="search-tag-header__pill">#{selectedTag}</div>
                                            <p className="search-tag-header__count">
                                                {tagPosts.length} post{tagPosts.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}

                                    {/* Tag posts shown inside hashtag tab */}
                                    {selectedTag && tab === 'hashtags' && (
                                        <div className="search-tag-posts">
                                            {tagPosts.length === 0 ? (
                                                <SearchEmpty label={`#${selectedTag}`} />
                                            ) : (
                                                tagPosts.map((p) => <PostCard key={p.id} post={p} />)
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const SearchEmpty = ({ label }) => (
    <div className="search-empty">
        <SearchIcon size={36} strokeWidth={1.2} />
        <h3>No results for "{label}"</h3>
        <p>Try different keywords or explore trending hashtags</p>
    </div>
);

export default Search;