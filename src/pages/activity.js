import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Title, Text, Button, Paper, Select, Alert } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useAuth } from '../components/auth/AuthProvider';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import AddTeeMarkersForm from '../components/AddTeeMarkersForm';
import AddRoundForm from '../components/AddRoundForm';

export default function ActivityPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [loadingData, setLoadingData] = useState(true);
  const [showAddRound, setShowAddRound] = useState(false);

  // Round entry state
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [roundDate, setRoundDate] = useState(new Date());
  const [availableTees, setAvailableTees] = useState([]);
  const [selectedTee, setSelectedTee] = useState(null);
  const [showAddTeeForm, setShowAddTeeForm] = useState(false);
  const [teeAddedSuccess, setTeeAddedSuccess] = useState(false);
  const [loadingTees, setLoadingTees] = useState(false);
  const [startedRound, setStartedRound] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch courses and user's rounds
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Fetch all courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_info')
          .select('id, name, region')
          .order('name');

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // TODO: Fetch rounds from database
        // const { data: rounds } = await supabase
        //   .from('rounds')
        //   .select('*')
        //   .eq('user_id', user.id)
        //   .order('round_date', { ascending: false });

        setLoadingData(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  // Fetch tees when course is selected
  useEffect(() => {
    if (!selectedCourse) {
      setAvailableTees([]);
      return;
    }

    async function fetchTees() {
      setLoadingTees(true);
      try {
        const { data: tees, error } = await supabase
          .from('course_tees')
          .select('id, tee_name, gender, num_holes, status')
          .eq('course_id', selectedCourse)
          .order('gender', { ascending: true })
          .order('tee_name', { ascending: true });

        if (error) throw error;
        setAvailableTees(tees || []);
      } catch (error) {
        console.error('Error fetching tees:', error);
        setAvailableTees([]);
      } finally {
        setLoadingTees(false);
      }
    }

    fetchTees();
  }, [selectedCourse]);

  // Handle tee selection
  const handleTeeChange = (value) => {
    if (value === 'add-new') {
      setShowAddTeeForm(true);
      setSelectedTee(null);
    } else {
      setSelectedTee(value);
      setShowAddTeeForm(false);
    }
  };

  // Handle successful tee addition
  const handleTeeAdded = (teeData) => {
    setTeeAddedSuccess(true);
    setShowAddTeeForm(false);
    setSelectedTee(teeData.id.toString());
    // Refresh the tee list
    setAvailableTees([...availableTees, teeData]);
  };

  // Get selected course details
  const getSelectedCourse = () => {
    if (!selectedCourse) return null;
    return courses.find(c => c.id.toString() === selectedCourse);
  };

  // Show loading state
  if (loading || loadingData) {
    return (
      <div className="container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your activities...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Activity - Kiwi Fairways</title>
        <meta name="description" content="Track your golf rounds and activities" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <Header />
        <div className="content-section">
          {/* Add Round Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <Button
              radius="xl"
              variant="light"
              color='var(--header-green)'
              onClick={() => setShowAddRound(!showAddRound)}
            >
              {showAddRound ? 'Cancel' : 'Add a Round'}
            </Button>
          </div>

          {/* Add Round Form */}
          {showAddRound && (
            <div style={{ marginBottom: '2rem' }}>
              <Paper shadow="sm" padding="xl" radius="md" withBorder>
                {!startedRound && (
                  <>
                    <Title order={3} style={{ marginBottom: '1.5rem' }}>Add a Round</Title>

                    {/* Course Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <Select
                        label="Select Course"
                        placeholder="Search for a course..."
                        searchable
                        nothingFoundMessage="No courses found"
                        data={courses.map(course => ({
                          value: course.id.toString(),
                          label: `${course.name} - ${course.region}`
                        }))}
                        value={selectedCourse}
                        onChange={setSelectedCourse}
                        size="md"
                      />
                    </div>

                    {/* Date Selection */}
                    {selectedCourse && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <DateInput
                          label="Round Date"
                          placeholder="Select date"
                          value={roundDate}
                          onChange={setRoundDate}
                          size="md"
                          maxDate={new Date()}
                        />
                      </div>
                    )}

                    {/* Success Message */}
                    {teeAddedSuccess && (
                      <Alert
                        color="green"
                        title="Thank you!"
                        style={{ marginBottom: '1.5rem' }}
                        onClose={() => setTeeAddedSuccess(false)}
                        withCloseButton
                      >
                        <Text size="sm">
                          Your tee markers have been added and will be reviewed by site admins for accuracy before being made official.
                        </Text>
                        <Text size="sm" style={{ marginTop: '0.5rem' }}>
                          You can go ahead and add a round using these tee markers in the meantime!
                        </Text>
                      </Alert>
                    )}

                    {/* Tee Selection */}
                    {selectedCourse && roundDate && !showAddTeeForm && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <Select
                          label="Select Tee"
                          placeholder="Choose tee markers..."
                          data={[
                            ...availableTees.map(tee => ({
                              value: tee.id.toString(),
                              label: `${tee.tee_name} - ${tee.gender} - ${tee.num_holes} holes${tee.status === 'pending' ? ' (Pending approval)' : ''}`
                            })),
                            { value: 'add-new', label: '+ Add Tee Markers for this Course' }
                          ]}
                          value={selectedTee}
                          onChange={handleTeeChange}
                          size="md"
                          disabled={loadingTees}
                        />
                        {availableTees.length === 0 && !loadingTees && (
                          <Text size="sm" color="dimmed" style={{ marginTop: '0.5rem' }}>
                            No tee markers available yet. Add them to continue.
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Add Tee Markers Form */}
                    {showAddTeeForm && selectedCourse && (
                      <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <AddTeeMarkersForm
                          courseId={selectedCourse}
                          courseName={getSelectedCourse()?.name || ''}
                          userId={user.id}
                          onSuccess={handleTeeAdded}
                          onCancel={() => setShowAddTeeForm(false)}
                        />
                      </div>
                    )}

                    {/* Start Round Button */}
                    {selectedTee && !showAddTeeForm && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <Button
                          onClick={() => setStartedRound(true)}
                          size="lg"
                          fullWidth
                          color="green"
                        >
                          Start Round
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Add Round Form - Shot by Shot Entry */}
                {startedRound && selectedTee && !showAddTeeForm && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <AddRoundForm
                      courseId={selectedCourse}
                      courseName={getSelectedCourse()?.name || ''}
                      teeId={selectedTee}
                      teeInfo={availableTees.find(t => t.id.toString() === selectedTee)}
                      roundDate={roundDate}
                      userId={user.id}
                      onSuccess={() => {
                        setStartedRound(false);
                        setShowAddRound(false);
                        setSelectedCourse(null);
                        setSelectedTee(null);
                        // TODO: Refresh rounds list
                      }}
                      onCancel={() => {
                        if (confirm('Are you sure you want to cancel this round? All progress will be lost.')) {
                          setStartedRound(false);
                        }
                      }}
                    />
                  </div>
                )}
              </Paper>
            </div>
          )}

          {/* Rounds List - Placeholder */}
          <Paper shadow="sm" padding="xl" radius="md" withBorder>
            <Title order={3} style={{ marginBottom: '1rem' }}>My Rounds</Title>
            <Text color="dimmed">
              No rounds yet. Click "Add a Round" to get started!
            </Text>
          </Paper>
        </div>
      </div>
    </>
  );
}
