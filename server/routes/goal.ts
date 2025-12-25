import { Router } from 'express';
import { Goal } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

let goals: Goal[] = [];

const createSeedData = () => {
  const now = new Date();
  const todayDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const goalsToSeed: Goal[] = [
    {
      id: '1',
      title: 'Finish Q4 Report',
      isCompleted: true,
      progress: 100,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 5),
      completedAt: new Date().setDate(now.getDate() - 2),
      scheduledDays: [todayDay === 0 ? 6 : todayDay - 1], // Yesterday
    },
    {
      id: '2',
      title: 'Plan Team Offsite',
      isCompleted: true,
      progress: 100,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 10),
      completedAt: new Date().setDate(now.getDate() - 1),
      scheduledDays: [todayDay], // Today
    },
    {
      id: '3',
      title: 'Develop New Feature',
      isCompleted: false,
      progress: 50,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 2),
      scheduledDays: [todayDay], // Today
    },
    {
      id: '4',
      title: 'Gather requirements',
      isCompleted: true,
      progress: 100,
      parentId: '3',
      createdAt: new Date().setDate(now.getDate() - 2),
      completedAt: new Date().setDate(now.getDate() - 0),
      scheduledDays: [todayDay], // Today
    },
    {
      id: '5',
      title: 'Daily Standup',
      isCompleted: false,
      progress: 0,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 1),
      scheduledDays: [], // Daily task
    },
    {
      id: '6',
      title: 'Review Code',
      isCompleted: false,
      progress: 0,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 3),
      scheduledDays: [1, 3, 5], // Mon, Wed, Fri
    },
    {
      id: '7',
      title: 'Weekly Sync with Manager',
      isCompleted: false,
      progress: 0,
      parentId: null,
      createdAt: new Date().setDate(now.getDate() - 7),
      scheduledDays: [todayDay], // Today
    },
  ];
  goals = goalsToSeed;
};

if (process.env.NODE_ENV !== 'production' && goals.length === 0) {
  createSeedData();
}


router.get('/', (req, res) => {
  res.json(goals);
});

router.post('/', (req, res) => {
  const newGoal = req.body;
  goals.push(newGoal);
  res.status(201).json(newGoal);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updatedGoal = req.body;
  goals = goals.map(goal => (goal.id === id ? updatedGoal : goal));
  res.json(updatedGoal);
});

router.post('/reorder', (req, res) => {
  const reorderedGoals = req.body;
  goals = reorderedGoals;
  res.status(200).json(goals);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  goals = goals.filter(goal => goal.id !== id);
  res.status(204).send();
});

router.get('/progress', (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const completedGoals = goals.filter(g => g.isCompleted && g.completedAt);

  // Weekly
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - i));
    const dayStart = day.getTime();
    const dayEnd = new Date(day).setHours(23, 59, 59, 999);

    const goalsCompleted = completedGoals.filter(g => g.completedAt! >= dayStart && g.completedAt! <= dayEnd);
    return {
      day: day.getDate(),
      progress: goalsCompleted.length, 
      goalIds: goalsCompleted.map(g => g.id),
    };
  });

  // Monthly
  const monthlyData = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (29 - i));
    const dayStart = day.getTime();
    const dayEnd = new Date(day).setHours(23, 59, 59, 999);

    const goalsCompleted = completedGoals.filter(g => g.completedAt! >= dayStart && g.completedAt! <= dayEnd);
    return {
      day: day.getDate(),
      progress: goalsCompleted.length,
      goalIds: goalsCompleted.map(g => g.id),
    };
  });
  
  // Yearly
  const yearlyData = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(today.getFullYear(), i, 1).getTime();
    const monthEnd = new Date(today.getFullYear(), i + 1, 0, 23, 59, 59, 999).getTime();

    const goalsCompleted = completedGoals.filter(g => g.completedAt! >= monthStart && g.completedAt! <= monthEnd);
    return {
      month: i + 1,
      progress: goalsCompleted.length,
      goalIds: goalsCompleted.map(g => g.id),
    };
  });

  res.json({ weekly: weeklyData, monthly: monthlyData, yearly: yearlyData });
});

export default router;
