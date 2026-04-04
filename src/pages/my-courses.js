import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, Select, NumberInput, Textarea, Paper, Alert, Switch } from '@mantine/core';
import { useAuth } from '../components/auth/AuthProvider';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { UserGreeting } from '../components/auth/UserGreeting';
import { HamburgerMenu } from '../components/auth/HamburgerMenu';
import { PlayedCoursesTable } from '../components/PlayedCoursesTable';

export default function MyCoursesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [playedCourses, setPlayedCourses] = useState([]);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Add course form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [favoriteHole, setFavoriteHole] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch user's data
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile(profile);

        // Get user's played courses with course info
        const { data: played } = await supabase
          .from('user_played_courses')
          .select(`
            *,
            course_info (
              id,
              name,
              region,
              website
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setPlayedCourses(played || []);

        // Get total courses count in NZ
        const { count } = await supabase
          .from('course_info')
          .select('*', { count: 'exact', head: true });

        setTotalCoursesCount(count || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  // Fetch all courses for the add form
  useEffect(() => {
    if (!user) return;

    async function fetchAllCourses() {
      try {
        const { data, error } = await supabase
          .from('course_info')
          .select('id, name, region')
          .order('name');

        if (error) throw error;
        setAllCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    }

    fetchAllCourses();
  }, [user]);

  // Handle add course form submission
  const handleAddCourse = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedCourseId) {
      setError('Please select a course');
      return;
    }

    if (!favoriteHole || favoriteHole < 1 || favoriteHole > 18) {
      setError('Please enter a valid hole number (1-18)');
      return;
    }

    if (!reason || reason.trim().length < 25) {
      setError('Please provide a reason (minimum 25 characters)');
      return;
    }

    setSubmitting(true);

    try {
      // Check if user has already added this course
      const { data: existing } = await supabase
        .from('user_played_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', selectedCourseId)
        .single();

      if (existing) {
        setError('You have already added this course to your list');
        setSubmitting(false);
        return;
      }

      // Insert the new played course
      const { error: insertError } = await supabase
        .from('user_played_courses')
        .insert({
          user_id: user.id,
          course_id: selectedCourseId,
          favorite_hole: favoriteHole,
          hole_description: reason.trim()
        });

      if (insertError) throw insertError;

      // Reset form and refresh data
      setShowAddForm(false);
      setSelectedCourseId(null);
      setFavoriteHole('');
      setReason('');

      // Refresh played courses
      const { data: played } = await supabase
        .from('user_played_courses')
        .select(`
          *,
          course_info (
            id,
            name,
            region,
            website
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPlayedCourses(played || []);
    } catch (error) {
      console.error('Error adding course:', error);
      setError('Failed to add course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle public/private toggle
  const handlePublicToggle = async (checked) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_public: checked })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUserProfile({ ...userProfile, is_public: checked });
    } catch (error) {
      console.error('Error updating profile visibility:', error);
    }
  };

  // Handle edit course
  const handleEdit = (courseId) => {
    // TODO: Implement edit functionality
    console.log('Edit course:', courseId);
    alert('Edit functionality coming soon!');
  };

  // Handle delete course
  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to remove this course from your list?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_played_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      // Refresh the list
      const { data: played } = await supabase
        .from('user_played_courses')
        .select(`
          *,
          course_info (
            id,
            name,
            region,
            website
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPlayedCourses(played || []);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  // Show loading state
  if (loading || loadingData) {
    return (
      <div className="container">
        {/* Custom Header without logo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'start',
          padding: '20px',
          width: '100%',
          maxWidth: '1500px',
          margin: '0 auto'
        }}>
          {/* LEFT: User greeting */}
          <div style={{ justifySelf: 'start' }}>
            <UserGreeting />
          </div>

          {/* RIGHT: Hamburger menu */}
          <div style={{ justifySelf: 'end' }}>
            <HamburgerMenu />
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your courses...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const playedCount = playedCourses.length;

  return (
    <>
      <Head>
        <title>My Courses - Kiwi Fairways</title>
        <meta name="description" content="Track the golf courses you've played in New Zealand" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        {/* Custom Header without logo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'start',
          padding: '20px',
          width: '100%',
          maxWidth: '1500px',
          margin: '0 auto'
        }}>
          {/* LEFT: User greeting */}
          <div style={{ justifySelf: 'start' }}>
            <UserGreeting />
          </div>

          {/* RIGHT: Hamburger menu */}
          <div style={{ justifySelf: 'end' }}>
            <HamburgerMenu />
          </div>
        </div>

        <Container size="lg" py="xl">
          <Stack spacing="xl">
            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-90px', marginBottom: '50px' }}>

              <img
                src="/images/logo_with_medal.png"
                alt="Kiwi Fairways Logo with Medal"
                style={{ maxWidth: '80px', height: 'auto', position: 'relative', zIndex: 10, marginBottom: '-14px' }}
              />
              <Paper
                p="md"
                radius="md"
                withBorder
                style={{
                  backgroundColor: 'var(--header-green)',

                  textAlign: 'center',
                  width: '100%'
                }}
              >
                <Text size="xl" weight={600} style={{ color: '#f0f4e8' }}>
                  {playedCount} of {totalCoursesCount} courses played
                </Text>
              </Paper>
            </div>

            {/* Action Buttons and Public/Private Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <Group>
                <Button
                  radius="xl"
                  variant="light"
                  color='var(--header-green)'
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? 'Cancel' : 'Add a Course'}
                </Button>
              </Group>

              <Switch
                withThumbIndicator={false}
                size="sm"
                radius="xl"
                color="var(--header-green)"
                label={userProfile?.is_public ? 'Profile is Public' : 'Profile is Private'}
                description={userProfile?.is_public ? `kiwifairways.co.nz/${userProfile?.username || 'username'}` : 'Set a username to make profile public'}
                checked={userProfile?.is_public || false}
                onChange={(event) => handlePublicToggle(event.currentTarget.checked)}
                labelPosition="left"
              />
            </div>

            {/* Add Course Form */}
            {showAddForm && (
              <Paper shadow="sm" padding="xl" radius="md" withBorder>
                <form onSubmit={handleAddCourse}>
                  <Stack spacing="md">
                    <Title order={3}>Add a Course</Title>

                    {error && (
                      <Alert color="red" title="Error">
                        {error}
                      </Alert>
                    )}

                    <Select
                      label="Search for a Course"
                      placeholder="Start typing to search..."
                      searchable
                      nothingFound="No courses found"
                      data={allCourses.map(course => ({
                        value: course.id.toString(),
                        label: `${course.name} - ${course.region}`
                      }))}
                      value={selectedCourseId}
                      onChange={setSelectedCourseId}
                      required
                      size="md"
                    />

                    {selectedCourseId && (
                      <>
                        <NumberInput
                          label="Favorite Hole"
                          placeholder="Enter hole number (1-18)"
                          min={1}
                          max={18}
                          value={favoriteHole}
                          onChange={setFavoriteHole}
                          required
                          size="md"
                        />

                        <Textarea
                          label="Why is this your favorite hole?"
                          placeholder="Tell us what makes this hole special... (minimum 25 characters)"
                          minRows={4}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                          size="md"
                        />

                        <Text size="xs" color="dimmed">
                          {reason.trim().length}/25 characters
                        </Text>

                        <Button
                          type="submit"
                          size="md"
                          loading={submitting}
                          disabled={!selectedCourseId || !favoriteHole || reason.trim().length < 25}
                        >
                          Add Course
                        </Button>
                      </>
                    )}
                  </Stack>
                </form>
              </Paper>
            )}

            {/* Courses Table */}
            <PlayedCoursesTable
              playedCourses={playedCourses}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Stack>
        </Container>
      </div>
    </>
  );
}
