require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

const USERS = [
  {
    email: 'alice@klyro.com',
    password: 'KlyroPassword123!',
    username: 'alice_dev',
    full_name: 'Alice Chen',
    github_username: 'alice-chen',
    role_category: 'FRONTEND',
    experience_level: 'ADVANCED',
    rating: 1150
  },
  {
    email: 'bob@klyro.com',
    password: 'KlyroPassword123!',
    username: 'bob_codes',
    full_name: 'Bob Martinez',
    github_username: 'bob-martinez',
    role_category: 'BACKEND',
    experience_level: 'ADVANCED',
    rating: 1120
  },
  {
    email: 'charlie@klyro.com',
    password: 'KlyroPassword123!',
    username: 'charlie_ai',
    full_name: 'Charlie Kim',
    github_username: 'charlie-kim',
    role_category: 'AI_ML',
    experience_level: 'INTERMEDIATE',
    rating: 1080
  },
  {
    email: 'diana@klyro.com',
    password: 'KlyroPassword123!',
    username: 'diana_prince',
    full_name: 'Diana Prince',
    github_username: 'diana-prince',
    role_category: 'FULLSTACK',
    experience_level: 'ADVANCED',
    rating: 1200
  },
  {
    email: 'ethan@klyro.com',
    password: 'KlyroPassword123!',
    username: 'ethan_ops',
    full_name: 'Ethan Hunt',
    github_username: 'ethan-hunt',
    role_category: 'DEVOPS',
    experience_level: 'INTERMEDIATE',
    rating: 1060
  },
  {
    email: 'fiona@klyro.com',
    password: 'KlyroPassword123!',
    username: 'fiona_sys',
    full_name: 'Fiona Gallagher',
    github_username: 'fiona-sys',
    role_category: 'BACKEND',
    experience_level: 'INTERMEDIATE',
    rating: 1040
  },
  {
    email: 'george@klyro.com',
    password: 'KlyroPassword123!',
    username: 'george_ui',
    full_name: 'George Vance',
    github_username: 'george-ui',
    role_category: 'FRONTEND',
    experience_level: 'BEGINNER',
    rating: 990
  }
];

async function seed() {
  console.log('==================================================');
  console.log('   KLYRO SEEDING: 7 Users & 3-Member Teams        ');
  console.log('==================================================');

  const createdUserProfiles = [];

  for (const u of USERS) {
    // 1. Check if auth user already exists
    let userId = null;
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find(usr => usr.email === u.email);

    if (existing) {
      userId = existing.id;
      // Update password to ensure it matches
      await supabaseAdmin.auth.admin.updateUserById(userId, { 
        password: u.password,
        email_confirm: true 
      });
      console.log(`[User Exists] ${u.email} -> ID: ${userId}`);
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: {
          username: u.username,
          full_name: u.full_name,
          github_username: u.github_username
        }
      });
      if (createErr) {
        console.error(`[Error Creating Auth] ${u.email}:`, createErr.message);
        continue;
      }
      userId = created.user.id;
      console.log(`[User Created] ${u.email} -> ID: ${userId}`);
    }

    // 2. Upsert profile
    const profilePayload = {
      id: userId,
      username: u.username,
      full_name: u.full_name,
      github_username: u.github_username,
      experience_level: u.experience_level,
      role: 'PLAYER',
      rating: u.rating,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
    };

    const { error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profErr) {
      console.error(`[Error Upserting Profile] ${u.username}:`, profErr.message);
    } else {
      console.log(`[Profile Ready] ${u.username} (${u.role_category})`);
    }

    createdUserProfiles.push({
      ...u,
      id: userId
    });
  }

  // Fetch available challenge
  const { data: challenges } = await supabaseAdmin
    .from('challenges')
    .select('id, title, time_limit_minutes')
    .limit(2);

  const chal1 = challenges?.[0] || { id: null, time_limit_minutes: 60, title: 'Competitive Frontend Arena' };
  const chal2 = challenges?.[1] || chal1;

  console.log('\n--- Building 3-Member Teams ---');

  // TEAM 1: Alice, Bob, Charlie (3 members: Frontend, Backend, AI_ML)
  const team1Members = createdUserProfiles.slice(0, 3);
  if (team1Members.length === 3) {
    const { data: team1, error: t1Err } = await supabaseAdmin
      .from('teams')
      .insert([{
        name: 'Klyro Titans',
        status: 'CONFIRMED',
        challenge_id: chal1.id
      }])
      .select()
      .single();

    if (t1Err) console.error('Error creating Team 1:', t1Err.message);
    else {
      console.log(`[Team 1 Created] ${team1.name} (ID: ${team1.id})`);
      
      // Add 3 members with ACCEPTED status
      const memberRows = team1Members.map(m => ({
        team_id: team1.id,
        profile_id: m.id,
        role_in_team: m.role_category,
        consent_status: 'ACCEPTED',
        responded_at: new Date().toISOString()
      }));

      await supabaseAdmin.from('team_members').insert(memberRows);
      console.log(` -> Added 3 members: ${team1Members.map(m => m.username).join(', ')}`);

      // Create Active Battle for Team 1 with live countdown (60 mins remaining)
      const now = new Date();
      const endTime = new Date(now.getTime() + (chal1.time_limit_minutes || 60) * 60000);
      const { data: battle1, error: b1Err } = await supabaseAdmin
        .from('battles')
        .insert([{
          team_id: team1.id,
          challenge_id: chal1.id,
          status: 'IN_PROGRESS',
          start_time: now.toISOString(),
          end_time: endTime.toISOString()
        }])
        .select()
        .single();

      if (b1Err) console.error('Error creating battle 1:', b1Err.message);
      else console.log(` -> Live Battle created! Countdown active until: ${endTime.toLocaleTimeString()}`);
    }
  }

  // TEAM 2: Diana, Ethan, Fiona (3 members: Fullstack, DevOps, Backend)
  const team2Members = createdUserProfiles.slice(3, 6);
  if (team2Members.length === 3) {
    const { data: team2, error: t2Err } = await supabaseAdmin
      .from('teams')
      .insert([{
        name: 'Cyber Phantoms',
        status: 'CONFIRMED',
        challenge_id: chal2.id
      }])
      .select()
      .single();

    if (t2Err) console.error('Error creating Team 2:', t2Err.message);
    else {
      console.log(`[Team 2 Created] ${team2.name} (ID: ${team2.id})`);

      const memberRows = team2Members.map(m => ({
        team_id: team2.id,
        profile_id: m.id,
        role_in_team: m.role_category,
        consent_status: 'ACCEPTED',
        responded_at: new Date().toISOString()
      }));

      await supabaseAdmin.from('team_members').insert(memberRows);
      console.log(` -> Added 3 members: ${team2Members.map(m => m.username).join(', ')}`);

      const now = new Date();
      const endTime = new Date(now.getTime() + (chal2.time_limit_minutes || 120) * 60000);
      await supabaseAdmin
        .from('battles')
        .insert([{
          team_id: team2.id,
          challenge_id: chal2.id,
          status: 'IN_PROGRESS',
          start_time: now.toISOString(),
          end_time: endTime.toISOString()
        }]);
      console.log(` -> Live Battle created! Countdown active until: ${endTime.toLocaleTimeString()}`);
    }
  }

  // USER 7: George Vance -> Put into matchmaking_queue to demonstrate active searching!
  const user7 = createdUserProfiles[6];
  if (user7) {
    await supabaseAdmin
      .from('matchmaking_queue')
      .upsert({
        profile_id: user7.id,
        skill_category: 'FRONTEND',
        entered_at: new Date().toISOString()
      }, { onConflict: 'profile_id' });
    console.log(`\n[Matchmaking Queue] ${user7.username} (${user7.email}) placed in live queue as FRONTEND.`);
  }

  console.log('\n==================================================');
  console.log('           SEEDING COMPLETE! ALL READY             ');
  console.log('==================================================');
  console.log('Credentials for all users:');
  console.log('Password for all users: KlyroPassword123!\n');
  createdUserProfiles.forEach(u => {
    console.log(` - ${u.full_name} (${u.role_category}): ${u.email}`);
  });
  console.log('==================================================\n');
}

seed().catch(console.error);
