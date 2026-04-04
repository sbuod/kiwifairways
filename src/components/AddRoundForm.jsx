import { useState, useEffect } from 'react';
import { Button, Paper, Text, Group, Stack, Badge, Timeline, Alert, NumberInput } from '@mantine/core';
import { supabase } from '../lib/supabase';

// Quick Stats Mode Component
function QuickStatsMode({
  holeData,
  currentHole,
  setCurrentHole,
  quickStats,
  setQuickStats,
  teeInfo,
  courseName,
  onCancel,
  onSuccess,
  userId,
  courseId,
  teeId,
  roundDate
}) {
  const [hitFairway, setHitFairway] = useState(null);
  const [hitGreen, setHitGreen] = useState(null);
  const [penalties, setPenalties] = useState(null);
  const [putts, setPutts] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentHolePar = holeData.find(h => h.hole_number === currentHole)?.par;
  const isPar3 = currentHolePar === 3;

  const handleNextHole = () => {
    // Save hole data
    const holeStats = {
      hole: currentHole,
      hitFairway: isPar3 ? null : hitFairway,
      hitGreen,
      penalties: penalties || 0,
      putts: putts
    };

    setQuickStats([...quickStats, holeStats]);

    // Move to next hole or complete
    if (currentHole < teeInfo.num_holes) {
      setCurrentHole(currentHole + 1);
      // Reset form
      setHitFairway(null);
      setHitGreen(null);
      setPenalties(null);
      setPutts(null);
    } else {
      // Round complete
      alert('Round complete! Time to save.');
    }
  };

  const handleSaveRound = async () => {
    setSubmitting(true);
    try {
      // TODO: Save to database
      console.log('Saving quick stats round:', {
        userId,
        courseId,
        teeId,
        roundDate,
        quickStats
      });
      alert('Round saved successfully! (Database integration pending)');
      onSuccess();
    } catch (err) {
      console.error('Error saving round:', err);
      alert('Failed to save round');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary stats
  const fairwaysHit = quickStats.filter(h => h.hitFairway === true).length;
  const fairwayOpportunities = quickStats.filter(h => h.hitFairway !== null).length;
  const greensHit = quickStats.filter(h => h.hitGreen === true).length;
  const totalPenalties = quickStats.reduce((sum, h) => sum + h.penalties, 0);
  const totalPutts = quickStats.reduce((sum, h) => sum + h.putts, 0);

  return (
    <Stack spacing="lg">
      {/* Round Header */}
      <Paper p="md" withBorder>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>
              Hole {currentHole} {currentHolePar && `(Par ${currentHolePar})`}
            </Text>
            <Text size="sm" color="dimmed">
              {courseName} - {teeInfo.tee_name}
            </Text>
          </div>
          {currentHole > 1 && (
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" color="dimmed">
                {fairwaysHit}/{fairwayOpportunities} FIR • {greensHit}/{currentHole - 1} GIR
              </Text>
              <Text size="xs" color="dimmed">
                {totalPutts} Putts • {totalPenalties} Penalties
              </Text>
            </div>
          )}
        </Group>
      </Paper>

      {/* Quick Entry Form - Morphing single area */}
      <Paper p="lg" withBorder>
        <Stack spacing="lg">
          <div style={{ width: '100%', maxWidth: '600px' }}>
            {/* Step 1: Fairway (skip on Par 3s) */}
            {!isPar3 && hitFairway === null && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Hit Fairway?</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  <Button
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => setHitFairway(true)}
                    styles={{
                      root: {
                        height: '50px',
                        fontSize: '14px',
                        width: '100%'
                      }
                    }}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => setHitFairway(false)}
                    styles={{
                      root: {
                        height: '50px',
                        fontSize: '14px',
                        width: '100%'
                      }
                    }}
                  >
                    No
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Green in Regulation */}
            {(isPar3 || hitFairway !== null) && hitGreen === null && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Hit Green in Regulation?</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  <Button
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => setHitGreen(true)}
                    styles={{
                      root: {
                        height: '50px',
                        fontSize: '14px',
                        width: '100%'
                      }
                    }}
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => setHitGreen(false)}
                    styles={{
                      root: {
                        height: '50px',
                        fontSize: '14px',
                        width: '100%'
                      }
                    }}
                  >
                    No
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Putts */}
            {hitGreen !== null && putts === null && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Number of Putts</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <Button
                      key={num}
                      variant="outline"
                      color="gray"
                      size="md"
                      onClick={() => setPutts(num)}
                      styles={{
                        root: {
                          height: '50px',
                          fontSize: '14px',
                          width: '100%'
                        }
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Penalties (auto-advance to next hole) */}
            {putts !== null && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Penalty Strokes</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  {[0, 1, 2, 3].map(num => (
                    <Button
                      key={num}
                      variant="outline"
                      color="gray"
                      size="md"
                      onClick={() => {
                        setPenalties(num);
                        // Auto-advance after penalty selection
                        setTimeout(() => {
                          handleNextHole();
                        }, 100);
                      }}
                      styles={{
                        root: {
                          height: '50px',
                          fontSize: '14px',
                          width: '100%'
                        }
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Stack>
      </Paper>

      {/* Previous Holes Summary */}
      {quickStats.length > 0 && (
        <Paper p="md" withBorder>
          <Text size="sm" weight={500} mb="xs">Completed Holes</Text>
          <Stack spacing="xs">
            {quickStats.map((hole, idx) => (
              <Group key={idx} position="apart">
                <Text size="sm">Hole {hole.hole}</Text>
                <Group spacing="md">
                  {hole.hitFairway !== null && (
                    <Badge size="sm" color={hole.hitFairway ? 'green' : 'gray'}>
                      {hole.hitFairway ? 'FIR' : 'Miss'}
                    </Badge>
                  )}
                  <Badge size="sm" color={hole.hitGreen ? 'green' : 'gray'}>
                    {hole.hitGreen ? 'GIR' : 'Miss'}
                  </Badge>
                  {hole.penalties > 0 && (
                    <Badge size="sm" color="orange">{hole.penalties} Pen</Badge>
                  )}
                  <Badge size="sm" color="blue">{hole.putts} Putts</Badge>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Action Buttons */}
      <Group position="apart">
        <Button variant="subtle" onClick={onCancel} disabled={submitting}>
          Cancel Round
        </Button>

        {quickStats.length > 0 && (
          <Button
            onClick={handleSaveRound}
            loading={submitting}
            variant="subtle"
            color="green"
          >
            Save Round
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export default function AddRoundForm({
  courseId,
  courseName,
  teeId,
  teeInfo,
  roundDate,
  userId,
  onSuccess,
  onCancel
}) {
  // Tracking mode: null = not chosen, 'quick' = Quick Stats, 'full' = Full Analysis
  const [trackingMode, setTrackingMode] = useState(null);

  const [currentHole, setCurrentHole] = useState(1);
  const [currentShot, setCurrentShot] = useState(1);
  const [shots, setShots] = useState([]); // All shots in the round (Full Analysis mode)
  const [quickStats, setQuickStats] = useState([]); // Quick stats per hole (Quick Stats mode)
  const [currentShotType, setCurrentShotType] = useState('tee-shot');
  const [currentResult, setCurrentResult] = useState(null);
  const [currentFlaw, setCurrentFlaw] = useState(null); // Replaces sentiment
  const [holeData, setHoleData] = useState([]); // Par for each hole
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch hole data (pars) for the selected tee
  useEffect(() => {
    async function fetchHoleData() {
      try {
        const { data, error } = await supabase
          .from('course_holes')
          .select('hole_number, par')
          .eq('tee_id', teeId)
          .order('hole_number');

        if (error) throw error;
        setHoleData(data || []);
      } catch (err) {
        console.error('Error fetching hole data:', err);
        setError('Failed to load hole information');
      }
    }

    fetchHoleData();
  }, [teeId]);

  const allShotTypes = [
    { value: 'tee-shot', label: 'Tee Shot' },
    { value: 'approach', label: 'Approach' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'lay-up', label: 'Lay Up' },
    { value: 'pitch', label: 'Pitch' },
    { value: 'chip', label: 'Chip' },
    { value: 'bunker', label: 'Bunker' },
    { value: 'putt', label: 'Putt' },
    { value: 'penalty', label: 'Penalty' }
  ];

  const allShotResults = [
    { value: 'fairway', label: 'Fairway' },
    { value: 'left', label: 'Left' },
    { value: 'big-left', label: 'Big Left' },
    { value: 'right', label: 'Right' },
    { value: 'big-right', label: 'Big Right' },
    { value: 'short', label: 'Short' },
    { value: 'long', label: 'Long' },
    { value: 'green', label: 'Green' },
    { value: 'same-bunker', label: 'Same Bunker 😤' },
    { value: 'in-hole', label: 'In Hole 🎉' },
    // Chip-specific results
    { value: 'gimme', label: 'Gimme' },
    { value: 'makeable', label: 'Makeable' },
    { value: 'lag', label: 'Lag' },
    { value: 'missed-green', label: 'Missed Green' },
    // Approach-specific results
    { value: 'under-6-feet', label: '<6 Feet' },
    { value: '6-20-feet', label: '6-20 Feet' },
    { value: '20-plus-feet', label: '20+ Feet' },
    { value: 'missed-short', label: 'Missed Short' },
    { value: 'missed-long', label: 'Missed Long' },
    { value: 'missed-left', label: 'Missed Left' },
    { value: 'missed-right', label: 'Missed Right' }
  ];

  // Get current hole's par
  const getCurrentHolePar = () => {
    const hole = holeData.find(h => h.hole_number === currentHole);
    return hole ? hole.par : null;
  };

  // Filter results based on shot type
  const getAvailableResults = () => {
    const currentHolePar = getCurrentHolePar();
    const isPar3 = currentHolePar === 3;

    // Putts - limited directional options with in-hole first
    if (currentShotType === 'putt') {
      const order = ['in-hole', 'short', 'long', 'left', 'right'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Penalty shots - just mark where you're dropping (no fairway on par 3)
    if (currentShotType === 'penalty') {
      const options = isPar3
        ? ['left', 'right']
        : ['fairway', 'left', 'right'];
      return allShotResults.filter(r => options.includes(r.value));
    }

    // Bunker shots
    if (currentShotType === 'bunker') {
      return allShotResults.filter(r =>
        ['green', 'short', 'long', 'left', 'right', 'same-bunker', 'in-hole'].includes(r.value)
      );
    }

    // Chip - proximity-based results
    if (currentShotType === 'chip') {
      const order = ['in-hole', 'gimme', 'makeable', 'lag', 'missed-green'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Pitch - same proximity tracking as approach shots
    if (currentShotType === 'pitch') {
      const order = ['in-hole', 'under-6-feet', '6-20-feet', '20-plus-feet', 'missed-short', 'missed-long', 'missed-left', 'missed-right'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Tee shot
    if (currentShotType === 'tee-shot') {
      if (isPar3) {
        // Par 3 tee shots use same proximity tracking as approach shots
        const order = ['in-hole', 'under-6-feet', '6-20-feet', '20-plus-feet', 'missed-short', 'missed-long', 'missed-left', 'missed-right'];
        return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
      }

      const isPar5 = currentHolePar === 5;

      if (isPar5) {
        // Par 5: can't reach green from tee
        const order = ['fairway', 'short', 'long', 'left', 'right', 'big-left', 'big-right'];
        return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
      }

      // Par 4: standard tee shot results
      const order = ['fairway', 'green', 'short', 'long', 'left', 'right', 'big-left', 'big-right'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Approach shots - proximity + miss pattern tracking
    if (currentShotType === 'approach') {
      const order = ['in-hole', 'under-6-feet', '6-20-feet', '20-plus-feet', 'missed-short', 'missed-long', 'missed-left', 'missed-right'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Recovery / Lay-up - standard directional results
    if (['recovery', 'lay-up'].includes(currentShotType)) {
      const order = ['fairway', 'green', 'short', 'long', 'left', 'right', 'big-left', 'big-right'];
      return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
    }

    // Default - standard directional results (shouldn't hit this often)
    const order = ['fairway', 'green', 'short', 'long', 'left', 'right', 'big-left', 'big-right'];
    return order.map(value => allShotResults.find(r => r.value === value)).filter(Boolean);
  };

  const shotResults = getAvailableResults();

  const flawOptions = [
    { value: 'execution', label: 'Execution' },
    { value: 'mental', label: 'Mental' }
  ];

  // Determine if current shot needs flaw analysis (only on misses)
  const needsFlawAnalysis = () => {
    if (trackingMode !== 'full') return false;
    if (!currentShotType || !currentResult) return false;

    // Penalties don't need flaw (it's obvious)
    if (currentShotType === 'penalty') return false;

    // Success results don't need flaw
    const successResults = ['fairway', 'green', 'in-hole', 'gimme', 'makeable', 'lag',
                           'under-6-feet', '6-20-feet', '20-plus-feet'];
    if (successResults.includes(currentResult)) return false;

    // Everything else is a miss that needs flaw analysis
    return true;
  };

  // Get previous shot result to determine available shot types
  const getPreviousShot = () => {
    const holeShots = getCurrentHoleShots();
    return holeShots.length > 0 ? holeShots[holeShots.length - 1] : null;
  };

  // Filter shot types based on previous shot result
  const getAvailableShotTypes = () => {
    const previousShot = getPreviousShot();

    // First shot is always tee shot (already set)
    if (!previousShot) {
      return allShotTypes.filter(t => t.value === 'tee-shot');
    }

    // After green, must be putt (already auto-set)
    if (previousShot.result === 'green') {
      return allShotTypes.filter(t => t.value === 'putt');
    }

    // After chip on green (gimme/makeable/lag), must be putt
    if (['gimme', 'makeable', 'lag'].includes(previousShot.result)) {
      return allShotTypes.filter(t => t.value === 'putt');
    }

    // After approach on green (any proximity), must be putt
    if (['under-6-feet', '6-20-feet', '20-plus-feet'].includes(previousShot.result)) {
      return allShotTypes.filter(t => t.value === 'putt');
    }

    // After missed putt, must be putt again
    if (previousShot.type === 'putt' && previousShot.result !== 'in-hole') {
      return allShotTypes.filter(t => t.value === 'putt');
    }

    // After same bunker, must be bunker again
    if (previousShot.result === 'same-bunker') {
      return allShotTypes.filter(t => t.value === 'bunker');
    }

    // After penalty following a tee shot, allow re-teeing
    if (previousShot.type === 'penalty') {
      const holeShots = getCurrentHoleShots();
      const shotBeforePenalty = holeShots.length >= 2 ? holeShots[holeShots.length - 2] : null;
      if (shotBeforePenalty && shotBeforePenalty.type === 'tee-shot') {
        return allShotTypes.filter(t => ['tee-shot', 'recovery', 'approach', 'pitch', 'chip', 'penalty'].includes(t.value));
      }
    }

    // After fairway - good position (no penalty needed)
    if (previousShot.result === 'fairway') {
      const currentHolePar = getCurrentHolePar();
      const isPar5 = currentHolePar === 5;
      const isSecondShot = previousShot.type === 'tee-shot';

      // Lay-up only available on second shot of par 5s
      if (isPar5 && isSecondShot) {
        return allShotTypes.filter(t =>
          ['approach', 'lay-up'].includes(t.value)
        );
      }
      // Otherwise just approach
      return allShotTypes.filter(t => t.value === 'approach');
    }

    // After miss (left, right, big-left, big-right) - need recovery options
    if (['left', 'right', 'big-left', 'big-right'].includes(previousShot.result)) {
      return allShotTypes.filter(t =>
        ['recovery', 'approach', 'pitch', 'chip', 'bunker', 'penalty'].includes(t.value)
      );
    }

    // After short/long - various options
    if (['short', 'long'].includes(previousShot.result)) {
      return allShotTypes.filter(t =>
        ['approach', 'recovery', 'pitch', 'chip', 'bunker', 'penalty'].includes(t.value)
      );
    }

    // Default - exclude tee-shot
    return allShotTypes.filter(t => t.value !== 'tee-shot');
  };

  // Get shots for current hole
  const getCurrentHoleShots = () => {
    return shots.filter(shot => shot.hole === currentHole);
  };

  const shotTypes = getAvailableShotTypes();

  // Handle adding a shot (called when flaw is selected OR when no flaw needed)
  const handleAddShot = (flaw = null) => {
    if (!currentShotType || !currentResult) {
      setError('Please select shot type and result');
      return;
    }

    const newShot = {
      hole: currentHole,
      shotNumber: currentShot,
      type: currentShotType,
      result: currentResult,
      flaw: flaw // null if good shot, 'execution' or 'mental' if miss
    };

    setShots([...shots, newShot]);

    // Check if hole is complete (ball in hole)
    if (currentResult === 'in-hole') {
      // Move to next hole
      const totalHoles = teeInfo.num_holes;
      if (currentHole < totalHoles) {
        setCurrentHole(currentHole + 1);
        setCurrentShot(1);
        setCurrentShotType('tee-shot'); // Reset to tee shot for new hole
      } else {
        // Round complete!
        alert('Round complete! Time to save.');
      }
    } else {
      // Continue on same hole
      setCurrentShot(currentShot + 1);
      // If ball is on green, next shot must be a putt
      if (currentResult === 'green') {
        setCurrentShotType('putt');
      } else {
        setCurrentShotType(null); // Reset for next shot
      }
    }

    // Reset form
    setCurrentResult(null);
    setCurrentFlaw(null);
    setError('');
  };

  // Handle saving the round
  const handleSaveRound = async () => {
    if (shots.length === 0) {
      setError('No shots recorded. Please add at least one shot.');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Save to database
      // 1. Create round record
      // 2. Create shot records for each shot
      // For now, just log the data
      console.log('Saving round:', {
        userId,
        courseId,
        teeId,
        roundDate,
        shots
      });

      alert('Round saved successfully! (Database integration pending)');
      onSuccess();
    } catch (err) {
      console.error('Error saving round:', err);
      setError('Failed to save round. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total score for completed holes
  const calculateScore = () => {
    let totalShots = 0;
    let totalPar = 0;

    for (let hole = 1; hole < currentHole; hole++) {
      const holeShots = shots.filter(s => s.hole === hole);
      totalShots += holeShots.length;

      const holePar = holeData.find(h => h.hole_number === hole)?.par || 0;
      totalPar += holePar;
    }

    return { totalShots, totalPar, score: totalShots - totalPar };
  };

  const { totalShots, totalPar, score } = calculateScore();
  const currentHolePar = getCurrentHolePar();
  const currentHoleShots = getCurrentHoleShots();

  if (holeData.length === 0) {
    return <Text>Loading hole information...</Text>;
  }

  // Tracking mode selection screen
  if (!trackingMode) {
    return (
      <Stack spacing="lg">
        <Paper p="lg" withBorder>
          <Stack spacing="md">
            <Text size="xl" weight={600}>Select Tracking Mode</Text>
            <Text size="sm" color="dimmed">
              Choose how you want to track this round
            </Text>

            <Stack spacing="md" mt="md">
              {/* Quick Stats */}
              <Paper
                p="lg"
                withBorder
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setTrackingMode('quick')}
                sx={(theme) => ({
                  '&:hover': {
                    backgroundColor: theme.colors.blue[0],
                    borderColor: theme.colors.blue[5]
                  }
                })}
              >
                <Stack spacing="xs">
                  <Group position="apart">
                    <Text size="lg" weight={600}>Quick Stats</Text>
                    <Badge color="green">2-3 min</Badge>
                  </Group>
                  <Text size="sm" color="dimmed">
                    Track FIRs, GIRs, Penalties, and Putts per hole
                  </Text>
                  <Text size="xs" color="dimmed">
                    Perfect for casual rounds or when you want basic trend tracking
                  </Text>
                </Stack>
              </Paper>

              {/* Full Analysis */}
              <Paper
                p="lg"
                withBorder
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setTrackingMode('full')}
                sx={(theme) => ({
                  '&:hover': {
                    backgroundColor: theme.colors.blue[0],
                    borderColor: theme.colors.blue[5]
                  }
                })}
              >
                <Stack spacing="xs">
                  <Group position="apart">
                    <Text size="lg" weight={600}>Full Analysis</Text>
                    <Badge color="blue">25-35 min</Badge>
                  </Group>
                  <Text size="sm" color="dimmed">
                    Shot-by-shot tracking with execution vs mental flaw analysis
                  </Text>
                  <Text size="xs" color="dimmed">
                    For rounds you want to learn from - complete performance insights
                  </Text>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Paper>

        <Group position="apart">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
        </Group>
      </Stack>
    );
  }

  // Quick Stats Mode
  if (trackingMode === 'quick') {
    return <QuickStatsMode
      holeData={holeData}
      currentHole={currentHole}
      setCurrentHole={setCurrentHole}
      quickStats={quickStats}
      setQuickStats={setQuickStats}
      teeInfo={teeInfo}
      courseName={courseName}
      onCancel={onCancel}
      onSuccess={onSuccess}
      userId={userId}
      courseId={courseId}
      teeId={teeId}
      roundDate={roundDate}
    />;
  }

  // Full Analysis Mode (rest of component)
  return (
    <Stack spacing="lg">
      {error && (
        <Alert color="red" title="Error" onClose={() => setError('')} withCloseButton>
          {error}
        </Alert>
      )}

      {/* Round Header */}
      <Paper p="md" withBorder style={{ backgroundColor: 'red' }}>
        <Group position="apart">
          <div>
            <Text size="lg" weight={600}>
              Hole {currentHole} {currentHolePar && `(Par ${currentHolePar})`}
            </Text>
            <Text size="sm" color="dimmed">
              {courseName} - {teeInfo.tee_name}
            </Text>
          </div>
          {currentHole > 1 && (
            <div style={{ textAlign: 'right' }}>
              <Text size="lg" weight={600}>
                Total Shots: {totalShots}{' '}
                <Text component="span" weight={700} color={score === 0 ? 'green' : score > 0 ? 'red' : 'blue'}>
                  ({score > 0 ? `+${score}` : score === 0 ? 'E' : score})
                </Text>
              </Text>
            </div>
          )}
        </Group>
      </Paper>

      {/* Shot Entry Form */}
      <Paper p="lg" withBorder>
        <Stack spacing="lg">
          <Group position="apart">
            <Text size="lg" weight={600}>
              Shot {currentShot}
            </Text>
            {currentShot === 1 && (
              <Badge size="lg" color="blue" variant="light">Tee Shot</Badge>
            )}
          </Group>

          {/* Single button grid area - morphs between shot type, result, and sentiment */}
          <div style={{ width: '100%', maxWidth: '600px' }}>
            {/* Shot Type */}
            {!currentShotType && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Shot Type</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  {shotTypes.map(type => (
                    <Button
                      key={type.value}
                      variant="outline"
                      color="gray"
                      size="md"
                      onClick={() => {
                        setCurrentShotType(type.value);
                      }}
                      styles={{
                        root: {
                          height: '50px',
                          fontSize: '14px',
                          width: '100%'
                        }
                      }}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Result (skip for penalty shots) */}
            {currentShotType && !currentResult && currentShotType !== 'penalty' && (
              <>
                <Text size="sm" weight={500} mb="xs" color="dimmed">Result</Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  width: '100%'
                }}>
                  {shotResults.map(result => (
                    <Button
                      key={result.value}
                      variant="outline"
                      color="gray"
                      size="md"
                      onClick={() => {
                        setCurrentResult(result.value);
                      }}
                      styles={{
                        root: {
                          height: '50px',
                          fontSize: '14px',
                          width: '100%'
                        }
                      }}
                    >
                      {result.label}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Flaw Analysis (only on misses) OR Auto-advance (on good shots) */}
            {currentShotType && (currentResult || currentShotType === 'penalty') && (() => {
              const needsFlaw = needsFlawAnalysis();

              // If shot doesn't need flaw, useEffect will auto-advance
              if (!needsFlaw) {
                return <Text size="sm" color="dimmed" ta="center">Processing...</Text>;
              }

              // Shot needs flaw analysis - show buttons
              return (
                <>
                  <Text size="sm" weight={500} mb="xs" color="dimmed">What went wrong?</Text>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    width: '100%'
                  }}>
                    {flawOptions.map(flaw => (
                      <Button
                        key={flaw.value}
                        variant="outline"
                        color="gray"
                        size="md"
                        onClick={() => {
                          // Add shot with flaw
                          const newShot = {
                            hole: currentHole,
                            shotNumber: currentShot,
                            type: currentShotType,
                            result: currentResult,
                            flaw: flaw.value
                          };

                          setShots(prev => [...prev, newShot]);

                          // Check if hole is complete
                          if (currentResult === 'in-hole') {
                            const totalHoles = teeInfo.num_holes;
                            if (currentHole < totalHoles) {
                              setCurrentHole(currentHole + 1);
                              setCurrentShot(1);
                              setCurrentShotType('tee-shot');
                            }
                          } else {
                            setCurrentShot(prev => prev + 1);

                            // Auto-set next shot type
                            if (currentResult === 'green' || ['gimme', 'makeable', 'lag', 'under-6-feet', '6-20-feet', '20-plus-feet'].includes(currentResult)) {
                              setCurrentShotType('putt');
                            } else if (currentResult === 'same-bunker') {
                              setCurrentShotType('bunker');
                            } else if (currentResult === 'fairway') {
                              const holePar = getCurrentHolePar();
                              const isPar5SecondShot = holePar === 5 && currentShotType === 'tee-shot';
                              setCurrentShotType(isPar5SecondShot ? null : 'approach');
                            } else {
                              setCurrentShotType(null);
                            }
                          }

                          // Reset form
                          setCurrentResult(null);
                          setCurrentFlaw(null);
                        }}
                        styles={{
                          root: {
                            height: '50px',
                            fontSize: '14px',
                            width: '100%'
                          }
                        }}
                      >
                        {flaw.label}
                      </Button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </Stack>
      </Paper>

      {/* Current Hole Shots - Below entry form to keep form position stable */}
      {currentHoleShots.length > 0 && (
        <Paper p="md" withBorder>
          <Text size="sm" weight={500} mb="xs">
            Hole {currentHole} - Shot History
          </Text>
          <Timeline active={currentHoleShots.length} bulletSize={24} lineWidth={2}>
            {currentHoleShots.map((shot, idx) => (
              <Timeline.Item
                key={idx}
                title={
                  <Group position="apart">
                    <Text size="sm">Shot {shot.shotNumber}</Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      compact
                      onClick={() => {
                        // Remove this shot and all subsequent shots on this hole
                        const updatedShots = shots.filter(s =>
                          s.hole !== currentHole || s.shotNumber < shot.shotNumber
                        );
                        setShots(updatedShots);

                        // Reset to this shot number
                        setCurrentShot(shot.shotNumber);
                        setCurrentShotType(shot.shotNumber === 1 ? 'tee-shot' : null);
                        setCurrentResult(null);
                        setCurrentFlaw(null);
                      }}
                    >
                      Edit
                    </Button>
                  </Group>
                }
                bullet={<Text size="xs">{shot.shotNumber}</Text>}
              >
                <Text size="sm">
                  {allShotTypes.find(s => s.value === shot.type)?.label} → {' '}
                  {allShotResults.find(r => r.value === shot.result)?.label}
                </Text>
                {shot.flaw && (
                  <Badge size="sm" color={shot.flaw === 'execution' ? 'red' : 'orange'} variant="light">
                    {shot.flaw === 'execution' ? 'Execution' : 'Mental'}
                  </Badge>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Paper>
      )}

      {/* Action Buttons */}
      <Group position="apart">
        <Button variant="subtle" onClick={onCancel} disabled={submitting}>
          Cancel Round
        </Button>

        {shots.length > 0 && (
          <Button
            onClick={handleSaveRound}
            loading={submitting}
            variant="subtle"
            color="green"
          >
            Save Round ({shots.length} shots)
          </Button>
        )}
      </Group>
    </Stack>
  );
}
