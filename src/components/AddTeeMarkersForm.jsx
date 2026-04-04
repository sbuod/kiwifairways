import { useState } from 'react';
import { Button, Select, TextInput, NumberInput, Alert, Text } from '@mantine/core';
import { supabase } from '../lib/supabase';

export default function AddTeeMarkersForm({ courseId, courseName, userId, onSuccess, onCancel }) {
  const [gender, setGender] = useState(null);
  const [numHoles, setNumHoles] = useState(null);
  const [teeName, setTeeName] = useState('');
  const [slope, setSlope] = useState('');
  const [rating, setRating] = useState('');
  const [parValues, setParValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate total par
  const calculateTotalPar = () => {
    const holes = numHoles === '9' ? 9 : 18;
    let total = 0;
    for (let i = 1; i <= holes; i++) {
      total += parseInt(parValues[i] || 0);
    }
    return total;
  };

  const totalPar = calculateTotalPar();

  // Check if all par values are filled
  const areAllParsEntered = () => {
    if (!numHoles) return false;
    const holes = numHoles === '9' ? 9 : 18;
    for (let i = 1; i <= holes; i++) {
      if (!parValues[i] || parValues[i] < 3 || parValues[i] > 5) {
        return false;
      }
    }
    return true;
  };

  // Check if form is complete
  const isFormComplete = () => {
    return (
      gender &&
      numHoles &&
      teeName.trim().length > 0 &&
      slope &&
      rating &&
      areAllParsEntered()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Insert tee record
      const { data: teeData, error: teeError } = await supabase
        .from('course_tees')
        .insert({
          course_id: courseId,
          tee_name: teeName.trim(),
          gender: gender,
          num_holes: parseInt(numHoles),
          slope_rating: parseFloat(slope),
          course_rating: parseFloat(rating),
          total_par: totalPar,
          status: 'pending',
          added_by_user_id: userId
        })
        .select()
        .single();

      if (teeError) throw teeError;

      // Insert hole pars
      const holes = numHoles === '9' ? 9 : 18;
      const holeRecords = [];
      for (let i = 1; i <= holes; i++) {
        holeRecords.push({
          tee_id: teeData.id,
          hole_number: i,
          par: parseInt(parValues[i])
        });
      }

      const { error: holesError } = await supabase
        .from('course_holes')
        .insert(holeRecords);

      if (holesError) throw holesError;

      // Success!
      onSuccess(teeData);
    } catch (err) {
      console.error('Error adding tee markers:', err);
      setError('Failed to add tee markers. Please try again.');
      setSubmitting(false);
    }
  };

  const renderParGrid = () => {
    if (!numHoles) return null;

    const holes = numHoles === '9' ? 9 : 18;
    const rows = numHoles === '9' ? 1 : 2;

    return (
      <div style={{ marginTop: '1.5rem' }}>
        <Text size="sm" weight={500} style={{ marginBottom: '0.75rem' }}>
          Enter par for each hole:
        </Text>

        {/* First 9 holes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '0.5rem',
          marginBottom: rows === 2 ? '0.75rem' : 0
        }}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map(hole => (
            <div key={hole}>
              <Text size="xs" color="dimmed" align="center" style={{ marginBottom: '0.25rem' }}>
                {hole}
              </Text>
              <NumberInput
                value={parValues[hole] || ''}
                onChange={(val) => setParValues({ ...parValues, [hole]: val })}
                min={3}
                max={5}
                size="sm"
                hideControls
                styles={{
                  input: {
                    textAlign: 'center',
                    fontWeight: 600
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Second 9 holes (if 18) */}
        {numHoles === '18' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(9, 1fr)',
            gap: '0.5rem'
          }}>
            {Array.from({ length: 9 }, (_, i) => i + 10).map(hole => (
              <div key={hole}>
                <Text size="xs" color="dimmed" align="center" style={{ marginBottom: '0.25rem' }}>
                  {hole}
                </Text>
                <NumberInput
                  value={parValues[hole] || ''}
                  onChange={(val) => setParValues({ ...parValues, [hole]: val })}
                  min={3}
                  max={5}
                  size="sm"
                  hideControls
                  styles={{
                    input: {
                      textAlign: 'center',
                      fontWeight: 600
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Total Par Display */}
        {totalPar > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <Text size="lg" weight={600}>
              Total Par: {totalPar}
            </Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Text size="md" weight={500} style={{ marginBottom: '1.5rem' }}>
        Add Tee Markers for {courseName}
      </Text>

      {error && (
        <Alert color="red" title="Error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      {/* Gender Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <Select
          label="Gender"
          placeholder="Select gender"
          data={[
            { value: 'Men', label: 'Men' },
            { value: 'Women', label: 'Women' }
          ]}
          value={gender}
          onChange={setGender}
          required
          size="md"
        />
      </div>

      {/* Number of Holes */}
      {gender && (
        <div style={{ marginBottom: '1rem' }}>
          <Select
            label="Number of Holes"
            placeholder="Select holes"
            data={[
              { value: '9', label: '9 Holes' },
              { value: '18', label: '18 Holes' }
            ]}
            value={numHoles}
            onChange={(val) => {
              setNumHoles(val);
              setParValues({}); // Reset par values when changing holes
            }}
            required
            size="md"
          />
        </div>
      )}

      {/* Tee Description */}
      {numHoles && (
        <div style={{ marginBottom: '1rem' }}>
          <TextInput
            label="Tee Description"
            placeholder="e.g., Blue Tees, Championship, White Tees"
            value={teeName}
            onChange={(e) => setTeeName(e.target.value)}
            required
            size="md"
          />
        </div>
      )}

      {/* Slope Rating */}
      {numHoles && (
        <div style={{ marginBottom: '1rem' }}>
          <NumberInput
            label="Slope Rating"
            placeholder="e.g., 113"
            value={slope}
            onChange={setSlope}
            min={55}
            max={155}
            required
            size="md"
          />
        </div>
      )}

      {/* Course Rating */}
      {numHoles && (
        <div style={{ marginBottom: '1rem' }}>
          <NumberInput
            label="Course Rating"
            placeholder="e.g., 72.5"
            value={rating}
            onChange={setRating}
            min={50}
            max={90}
            step={0.1}
            precision={1}
            required
            size="md"
          />
        </div>
      )}

      {/* Par Grid */}
      {renderParGrid()}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          fullWidth
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isFormComplete() || submitting}
          loading={submitting}
          fullWidth
        >
          Save Tee Markers
        </Button>
      </div>
    </form>
  );
}
