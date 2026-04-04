# Round Tracking - Two-Tier System

## Overview
Built a flexible round tracking system with two modes to match different use cases:
1. **Quick Stats** (2-3 min) - FIR, GIR, Penalties, Putts per hole
2. **Full Analysis** (25-35 min) - Shot-by-shot tracking with execution vs mental flaw analysis

## Component: AddRoundForm.jsx

### Initial Flow
1. User selects course → date → tee markers on activity.js
2. Clicks "Start Round" button
3. **Tracking Mode Selection** screen appears with two options:
   - **Quick Stats** (2-3 min) - Basic stats tracking
   - **Full Analysis** (25-35 min) - Detailed shot-by-shot with flaw analysis
4. User selects their preferred mode
5. Tracking begins based on selected mode

---

## Mode 1: Quick Stats

### Purpose
Fast, straightforward tracking for casual rounds or basic trend analysis.

### Per-Hole Entry
For each hole, user enters:
- **Hit Fairway?** (Yes/No) - Skipped on Par 3s
- **Hit Green in Regulation?** (Yes/No)
- **Penalty Strokes** (0, 1, 2, 3)
- **Number of Putts** (0, 1, 2, 3, 4)

### Live Summary
Header shows running totals:
- X/Y FIR (Fairways in Regulation)
- X/Y GIR (Greens in Regulation)
- Total Putts
- Total Penalties

### Data Structure
```javascript
{
  hole: 1,
  hitFairway: true,    // null on Par 3s
  hitGreen: false,
  penalties: 0,
  putts: 2
}
```

---

## Mode 2: Full Analysis

### Purpose
Complete shot-by-shot tracking with execution vs mental flaw analysis for rounds you want to learn from.

### Flow
1. Course/date/tee selection fields are hidden after mode selection
2. Shot-by-shot entry begins at Hole 1, Shot 1 (Tee Shot)
3. For each shot:
   - Select **Type** (Tee Shot, Approach, Chip, Putt, etc.)
   - Select **Result** (Fairway, Green, Left, Short, In Hole, etc.)
   - **Conditional Flaw Analysis:**
     - If shot was a **success** (Fairway, Green, In Hole, good proximity) → Auto-advance (2 clicks)
     - If shot was a **miss** → Select **Flaw** (Execution or Mental) (3 clicks)
4. Automatically advances to next shot/hole
5. Running score displayed as "Total Shots: xx (+/- y)" where xx is total shots and y is score to par
6. Round completes after all holes finished

### Data Entry Speed Optimizations

**Button Grids (Not Dropdowns)**
- All options shown as button grids for one-click selection
- Shot Type: 3x3 grid (9 buttons or fewer based on context)
- Result: 3x4 grid (11 buttons or fewer, varies based on shot type)
- Sentiment: 3 buttons
- All buttons same size (50px height) for consistency

**Morphing Single-Grid UI (Minimal Mouse Travel)**
- Only ONE button grid is shown at a time - it morphs in place:
  1. First shows Shot Type buttons
  2. After selection → Same grid location shows Result buttons
  3. After selection → Same grid location shows Sentiment buttons
- All grids have identical width (max 600px) and identical button sizing
- Every grid uses same 3-column layout for consistency
- Buttons are 50px height x 100% width in their grid cell
- All grids appear in the exact same screen position - no layout shift
- User can click the same spot 3 times if they always want the first option
- Eliminates both vertical and horizontal mouse movement between sections
- Shot entry form stays in same position throughout entire round
- Shot history displays BELOW the entry form so adding shots doesn't push form down the page

**Clean Interface During Play**
- Once round starts, course/date/tee selection fields are hidden
- Only shot entry interface is visible during round
- Minimizes distractions and focuses on shot tracking

**Auto-Progression**
- No "Add Shot" button - clicking sentiment automatically records shot and moves to next
- Result section hidden for penalty shots (only 2 clicks needed)

**Contextual Options**
- Only relevant shot types/results shown based on previous shot
- Reduces cognitive load and speeds up entry

## Shot Types
- Tee Shot
- Approach
- Recovery
- Lay Up
- Pitch
- Chip
- Bunker
- Putt
- Penalty

## Shot Results
- Fairway
- Left, Big Left
- Right, Big Right
- Short, Long
- Green
- Same Bunker 😤 (for bunker shots only)
- In Hole 🎉
- **Chip-specific results (close-range proximity):**
  - Gimme (< 3 feet)
  - Makeable (3-10 feet)
  - Lag (10+ feet)
  - Missed Green
- **Approach/Pitch-specific results (precision proximity):**
  - <6 Feet (kick-in range)
  - 6-20 Feet (circle)
  - 20+ Feet (two-putt range)
  - Missed Short
  - Missed Long
  - Missed Left
  - Missed Right

## Flaw Analysis Options (Full Analysis Mode Only)

Only asked when a shot misses (fairway miss, green miss, missed putt, etc.):
- **Execution** - Physical mistake (bad swing, poor contact, mechanical failure)
- **Mental** - Decision/strategy mistake (wrong club, wrong target, indecision, poor course management)

## Contextual Logic Rules

### Automatic Shot Type Setting
1. **First shot of hole**: Auto-set to "Tee Shot"
2. **After green**: Auto-set to "Putt"
3. **After missed putt**: Auto-set to "Putt" (stays on putting until in hole)
4. **After chip on green** (Gimme/Makeable/Lag): Auto-set to "Putt"
5. **After approach/pitch on green** (<6 Feet/6-20 Feet/20+ Feet): Auto-set to "Putt"
6. **After fairway (Par 3/4 or Par 5 3rd+ shot)**: Auto-set to "Approach"
7. **After fairway (Par 5 2nd shot)**: Choice between "Approach" or "Lay-up"
8. **After same bunker**: Auto-set to "Bunker" (stays as bunker shot until out)

### Available Shot Types (Based on Previous Shot)
- **After Fairway (Par 5, 2nd shot)**: Approach, Lay-up
- **After Fairway (Par 3/4, or Par 5 3rd+ shot)**: Approach only (auto-set)
- **After Green**: Putt only
- **After Missed Putt**: Putt only
- **After Chip on Green** (Gimme/Makeable/Lag): Putt only
- **After Approach/Pitch on Green** (<6 Feet/6-20 Feet/20+ Feet): Putt only
- **After Missed Green** (chip, pitch, or approach): Various recovery options
- **After Same Bunker**: Bunker only (stays in bunker until out)
- **After Miss (Left/Right/Big)**: Recovery, Approach, Pitch, Chip, Bunker, Penalty (no Lay-up)
- **After Short/Long**: Approach, Recovery, Pitch, Chip, Bunker, Penalty
- **After Penalty (following tee shot)**: Tee Shot, Recovery, Approach, Pitch, Chip, Penalty (allows re-teeing)

### Available Results (Based on Shot Type and Hole Par)
- **Putt**: In Hole (first), Short, Long, Left, Right
- **Penalty**: No result needed (skipped)
- **Bunker Shot**: Green, Short, Long, Left, Right, Same Bunker 😤, In Hole
- **Chip**: In Hole 🎉, Gimme (< 3'), Makeable (3-10'), Lag (10+'), Missed Green
- **Pitch**: In Hole 🎉, <6 Feet, 6-20 Feet, 20+ Feet, Missed Short, Missed Long, Missed Left, Missed Right *(same as approach)*
- **Approach**: In Hole 🎉, <6 Feet, 6-20 Feet, 20+ Feet, Missed Short, Missed Long, Missed Left, Missed Right
- **Tee Shot (Par 3)**: In Hole 🎉, <6 Feet, 6-20 Feet, 20+ Feet, Missed Short, Missed Long, Missed Left, Missed Right *(same as approach)*
- **Tee Shot (Par 4)**: Fairway, Green, Short, Long, Left, Right, Big Left, Big Right
- **Tee Shot (Par 5)**: Fairway, Short, Long, Left, Right, Big Left, Big Right *(no Green option)*
- **Recovery**: Fairway, Green, Short, Long, Left, Right, Big Left, Big Right
- **Lay-up**: Fairway, Green, Short, Long, Left, Right, Big Left, Big Right
- **Note**: Water has been removed from all result options. "Same Bunker 😤" is only available for bunker shots. Par 3 tee shots, Approach shots, Pitch shots, and Chip shots use proximity-based results when on green, with directional miss patterns when off green. Par 5 tee shots cannot reach the green.

## Editing Shots

**Timeline Edit (Shot History)**
- Each shot in timeline has "Edit" button
- Clicking Edit removes that shot and all subsequent shots on that hole only
- Resets to that shot number to re-enter
- Shots from other holes remain intact
- Use this to fix mistakes or change earlier shots in the hole

## Hole Completion
- Hole completes when result is "In Hole"
- Automatically advances to next hole
- Resets to Shot 1, Tee Shot

## Round Completion
- After final hole completed, shows "Round complete! Time to save."
- User can save round or cancel

## Data Structures

### Quick Stats Mode
```javascript
{
  hole: 1,
  hitFairway: true,    // null on Par 3s
  hitGreen: false,
  penalties: 0,
  putts: 2
}
```

### Full Analysis Mode
```javascript
{
  hole: 1,              // Hole number (1-18 or 1-9)
  shotNumber: 1,        // Shot number on this hole
  type: 'tee-shot',     // Shot type
  result: 'fairway',    // Shot result (or 'penalty' for penalty shots)
  flaw: null            // null if good shot, 'execution' or 'mental' if miss
}
```

## Database Integration (TODO)

### Tables Needed
1. **`rounds` table**
   - user_id, course_id, tee_id, round_date
   - tracking_mode ('quick' or 'full')
   - created_at, updated_at

2. **`shots` table** (Full Analysis mode only)
   - round_id, hole, shot_number
   - type, result
   - flaw (nullable: 'execution', 'mental', or null)

3. **`hole_stats` table** (Quick Stats mode only)
   - round_id, hole
   - hit_fairway (nullable - null on Par 3s)
   - hit_green
   - penalties
   - putts

### Implementation Tasks
- Save round on completion based on mode
- Display rounds history with mode indicator
- Analytics view varies by tracking mode

## UI/UX Principles Applied
1. **Minimize clicks**: Auto-advance, auto-default, skip unnecessary fields
2. **Minimal mouse movement**: Morphing single-grid design keeps buttons in same screen location throughout entire round
3. **Stable UI position**: Shot history below entry form prevents form from moving down as shots are added
4. **Contextual relevance**: Only show options that make sense
5. **Visual clarity**: Button grids, consistent sizing, clear labels
6. **Error prevention**: Disabled buttons until prerequisites met
7. **Speed over perfection**: Focus on fast data entry during round
8. **Progressive disclosure**: Show one step at a time
9. **Easy correction**: Edit shots from timeline history below entry form

## Key Benefits by Mode

### Quick Stats Benefits
- **Speed**: 2-3 minutes total entry time
- **Trend tracking**: Monitor FIR/GIR percentages over time
- **Low friction**: Perfect for casual rounds
- **Universal metrics**: Compare across all rounds easily
- **Post-round insights**: "I hit 10/14 fairways but only 8/18 greens"

### Full Analysis Benefits
- **Root cause analysis**: Separate execution failures from mental mistakes
- **Actionable insights**: "I lost 8 strokes to mental errors, 5 to execution"
- **Pattern detection**: "My driver misses are 70% mental, approach shots 80% execution"
- **Practice prioritization**: Know whether to hit the range or study course strategy
- **Shot-level granularity**: Complete picture of every shot in the round
- **Execution vs Mental split**: Answers the critical question "Is it my swing or my brain?"

### Data Value Examples (Full Analysis)
After 10 rounds:
- "Driver misses: 70% mental (too aggressive), 30% execution"
- "Approach shots inside 150: 80% execution (poor contact), 20% mental"
- "Putts 6-15 feet: 60% execution (poor stroke), 40% mental (misread/pace)"
- "I'm losing 5 strokes/round to poor decisions, 2 to bad strikes → focus on course management"

## Future Enhancements (Potential)
- Save incomplete rounds (resume later)
- Add club selection per shot (Full Analysis only)
- Add distance tracking
- Add lie/conditions
- Statistics dashboard with mode-specific analytics
- Compare rounds over time
- Execution vs Mental trend charts (Full Analysis)
- Strokes Gained analysis by category
