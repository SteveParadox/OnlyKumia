import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  Box,
  Chip,
  Button,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../Utils/axios';
import '../Css/Search.css';

/**
 * Search Results Page
 * - Displays search results for creators, content, and messages
 * - Filters and sorting options
 * - Integration with backend search API (TODO)
 */
function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  // Mock search results (replace with real API)
  const [results, setResults] = useState([
    {
      id: 'creator1',
      type: 'creator',
      name: 'Jane Fitness',
      avatar: '/avatars/user1.jpg',
      description: 'Fitness coach, yoga instructor',
      followers: 1200,
      verified: true,
    },
    {
      id: 'content1',
      type: 'content',
      title: 'Morning Yoga Routine',
      thumbnail: '/thumbs/yoga.jpg',
      creator: 'Jane Fitness',
      views: 3400,
      duration: '25:30',
    },
    {
      id: 'creator2',
      type: 'creator',
      name: 'Marcus Training',
      avatar: '/avatars/user2.jpg',
      description: 'Personal trainer, strength coach',
      followers: 890,
      verified: false,
    },
    {
      id: 'content2',
      type: 'content',
      title: 'HIIT Workout Challenge',
      thumbnail: '/thumbs/hiit.jpg',
      creator: 'Marcus Training',
      views: 5200,
      duration: '30:00',
    },
  ]);

  const [filteredResults, setFilteredResults] = useState(results);
  const [filterType, setFilterType] = useState('all'); // 'all', 'creators', 'content'
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'newest', 'popular'
  const [localSearch, setLocalSearch] = useState(query);

  // Filter results
  useEffect(() => {
    let filtered = results;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    // Apply search query
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      filtered = filtered.filter((r) =>
        r.name?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.creator?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    if (sortBy === 'popular') {
      filtered.sort((a, b) => {
        const aScore = a.followers || a.views || 0;
        const bScore = b.followers || b.views || 0;
        return bScore - aScore;
      });
    }

    setFilteredResults(filtered);
  }, [localSearch, filterType, sortBy, results]);

  // Handle search submission
  const handleSearch = (e) => {
    e?.preventDefault();
    if (localSearch.trim()) {
      setSearchParams({ q: localSearch });
    }
  };

  // Navigate to creator profile
  const goToCreator = (creatorId) => {
    navigate(`/creator/${creatorId}`);
  };

  const creatorResults = filteredResults.filter((r) => r.type === 'creator');
  const contentResults = filteredResults.filter((r) => r.type === 'content');

  return (
    <Container maxWidth="lg" className="search-page">
      {/* Search Bar */}
      <Box className="search-header" component="form" onSubmit={handleSearch}>
        <TextField
          placeholder="Search creators, content, messages..."
          variant="outlined"
          fullWidth
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className="search-input"
        />
        <Button type="submit" variant="contained" color="primary">
          Search
        </Button>
      </Box>

      {/* Filters & Sort */}
      <Box className="search-filters">
        <Box className="filter-group">
          <Chip
            label="All"
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'filled' : 'outlined'}
            color={filterType === 'all' ? 'primary' : 'default'}
          />
          <Chip
            label="Creators"
            onClick={() => setFilterType('creators')}
            variant={filterType === 'creators' ? 'filled' : 'outlined'}
            color={filterType === 'creators' ? 'primary' : 'default'}
          />
          <Chip
            label="Content"
            onClick={() => setFilterType('content')}
            variant={filterType === 'content' ? 'filled' : 'outlined'}
            color={filterType === 'content' ? 'primary' : 'default'}
          />
        </Box>

        <Box className="sort-group">
          <TextField
            select
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            SelectProps={{ native: true }}
            className="sort-select"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </TextField>
        </Box>
      </Box>

      {/* Results */}
      {filteredResults.length === 0 ? (
        <Box className="no-results">
          <Typography variant="h6">No results found</Typography>
          <Typography variant="body2" color="textSecondary">
            Try a different search query or check the filters
          </Typography>
        </Box>
      ) : (
        <>
          {/* Creators Section */}
          {creatorResults.length > 0 && (
            <Box className="results-section">
              <Typography variant="h5" className="section-title">
                Creators
              </Typography>
              <Grid container spacing={2}>
                {creatorResults.map((creator) => (
                  <Grid item xs={12} sm={6} md={4} key={creator.id}>
                    <Card
                      className="creator-card"
                      onClick={() => goToCreator(creator.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Box className="creator-avatar-section">
                        <img src={creator.avatar} alt={creator.name} className="creator-avatar" />
                        {creator.verified && <span className="verified-badge">✓</span>}
                      </Box>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {creator.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" className="creator-description">
                          {creator.description}
                        </Typography>
                        <Typography variant="caption" className="followers-count">
                          {creator.followers.toLocaleString()} followers
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Content Section */}
          {contentResults.length > 0 && (
            <Box className="results-section">
              <Typography variant="h5" className="section-title">
                Content
              </Typography>
              <Grid container spacing={2}>
                {contentResults.map((content) => (
                  <Grid item xs={12} sm={6} md={4} key={content.id}>
                    <Card className="content-card">
                      <CardMedia
                        component="img"
                        height="200"
                        image={content.thumbnail}
                        alt={content.title}
                        className="content-thumbnail"
                      />
                      <Box className="content-duration">{content.duration}</Box>
                      <CardContent>
                        <Typography variant="subtitle2" component="div" className="content-title">
                          {content.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          by {content.creator}
                        </Typography>
                        <Typography variant="caption" className="content-stats">
                          {content.views.toLocaleString()} views
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Search;
