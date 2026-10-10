-- V2__seed_demo_data.sql
-- Seed Resources, Booking Policies, and Initial Setup

-- 1. Booking Policies
INSERT INTO booking_policies (policy_key, policy_value, description) VALUES
('MAX_ADVANCE_DAYS', '30', 'Maximum number of days in advance a resource can be booked'),
('MIN_NOTICE_HOURS', '2', 'Minimum notice period in hours required before start time'),
('CANCELLATION_MIN_HOURS', '2', 'Hours before booking start time after which cancellation is locked'),
('AUTO_APPROVE_FACULTY', 'false', 'Whether faculty bookings are automatically approved without admin review');

-- 2. University Campus Resources
-- Exactly three categories: CLASSROOM, LABORATORY, AUDITORIUM
INSERT INTO resources (name, type, building, room_number, capacity, description, department, amenities, operating_open_time, operating_close_time, is_active, image_url) VALUES
(
    'Smart Lecture Hall A',
    'CLASSROOM',
    'Academic Complex Block 1',
    'CR-101',
    60,
    'Modern tiered lecture hall with integrated interactive smart display, automated capture, and ergonomic seating.',
    'General Academics',
    'Interactive Smart Board, Dual Projectors, Air Conditioning, Audio Recording, High-Speed Wi-Fi',
    '08:00:00',
    '21:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80'
),
(
    'Seminar Classroom B',
    'CLASSROOM',
    'Engineering Building',
    'CR-204',
    45,
    'Collaborative classroom layout optimized for interactive seminars, student presentations, and department workshops.',
    'School of Engineering',
    'Digital Podium, Ceiling Mic Array, Dual Whiteboards, Motorized Projection Screen',
    '08:00:00',
    '20:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80'
),
(
    'Executive Case Study Studio',
    'CLASSROOM',
    'Management Wing',
    'CR-302',
    35,
    'Horseshoe-style executive classroom equipped for case study discussions, group deliberations, and hybrid masterclasses.',
    'School of Management',
    'Tiered Seating, Nameplate Stands, Lapel Microphones, Dual Display Monitors, Air Conditioning',
    '08:00:00',
    '21:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
),
(
    'Advanced AI & GPU Computing Lab',
    'LABORATORY',
    'Computer Science Complex',
    'LAB-105',
    40,
    'State-of-the-art laboratory powered by 40 GPU workstations for deep learning, AI research, and high-performance computing.',
    'Computer Science & Engineering',
    '40 Workstations (NVIDIA RTX GPUs), Gigabit Ethernet, Central Video Wall, Central UPS, 2.5 Gbps Switch',
    '08:30:00',
    '21:30:00',
    TRUE,
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80'
),
(
    'Cybersecurity & Cloud Systems Lab',
    'LABORATORY',
    'Computer Science Complex',
    'LAB-201',
    36,
    'Isolated network laboratory designed for penetration testing simulations, cloud infrastructure labs, and cyber competitions.',
    'Cybersecurity & Information Security',
    'Isolated Virtualization Server, Dual Monitor Setups, Console Terminals, Hardware Firewall Testbed',
    '08:30:00',
    '21:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
),
(
    'Data Science & Analytics Lab',
    'LABORATORY',
    'Academic Complex Block 2',
    'LAB-310',
    50,
    'High-capacity academic laboratory configured with data science software, statistical packages, and collaborative workstations.',
    'Data Science & Analytics',
    '50 High-Speed All-in-One PCs, Central Overhead Projector, Dedicated Instructor Console, High-Flow AC',
    '08:00:00',
    '21:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80'
),
(
    'Dr. APJ Abdul Kalam Grand Auditorium',
    'AUDITORIUM',
    'University Center',
    'AUD-MAIN',
    500,
    'Flagship campus auditorium designed for international symposiums, convocation ceremonies, guest lectures, and cultural galas.',
    'Campus Facilities Administration',
    '4K Main LED Wall, Line Array Audio System, Stage Automated Lighting, 6 Wireless Microphones, VIP Green Rooms, Wheelchair Accessible',
    '08:00:00',
    '22:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
),
(
    'Rabindranath Tagore Academic Auditorium',
    'AUDITORIUM',
    'Arts & Humanities Building',
    'AUD-MINI',
    220,
    'Medium-scale acoustic auditorium specialized for departmental seminars, debate championships, and guest lectures.',
    'Arts & Humanities',
    'Acoustic Paneling, Dual Ultra-Short-Throw Projectors, High-Fidelity Audio System, Digital Podium',
    '08:00:00',
    '21:00:00',
    TRUE,
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
);
