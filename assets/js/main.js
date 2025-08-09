/*
 * Main JavaScript for portfolio site
 *
 * This script loads data from data/data.json and populates page
 * content dynamically. It also implements a dark mode toggle that
 * persists across pages using localStorage.
 */

async function loadData() {
  try {
    const response = await fetch('data/data.json');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error loading data:', err);
    return null;
  }
}

// Apply saved dark mode preference on page load
function applySavedTheme() {
  const saved = localStorage.getItem('dark-mode');
  if (saved === 'true') {
    document.body.classList.add('dark-mode');
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', 'true');
      toggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
  }
}

function setupDarkModeToggle() {
  const btn = document.getElementById('dark-mode-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDark);
    // swap icon
    const icon = btn.querySelector('i');
    if (icon) {
      if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  });
}

// Populate index page
async function initIndex() {
  const data = await loadData();
  if (!data) return;
  // About section
  const summaryEl = document.getElementById('about-summary');
  if (summaryEl) {
    summaryEl.textContent = data.basics.summary;
  }
  // Skills list
  const skillsList = document.getElementById('skills-list');
  if (skillsList) {
    skillsList.innerHTML = '';
    data.skills.forEach(skill => {
      const li = document.createElement('li');
      li.className = 'list-inline-item me-2 mb-2';
      li.innerHTML = `<span class="badge bg-primary-subtle text-primary fw-normal">${skill}</span>`;
      skillsList.appendChild(li);
    });
  }
  // Stats
  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="col-md-4 text-center mb-3">
        <h3 class="fw-bold mb-0">${data.publications.length}</h3>
        <p class="text-muted">Publications</p>
      </div>
      <div class="col-md-4 text-center mb-3">
        <h3 class="fw-bold mb-0">${data.projects.length}</h3>
        <p class="text-muted">Projects</p>
      </div>
      <div class="col-md-4 text-center mb-3">
        <h3 class="fw-bold mb-0">${data.blogPosts.length}</h3>
        <p class="text-muted">Blog Posts</p>
      </div>
    `;
  }
  // Top projects (first three)
  const projectContainer = document.getElementById('project-cards');
  if (projectContainer) {
    projectContainer.innerHTML = '';
    const topProjects = data.projects.slice(0, 3);
    topProjects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'col-md-4 mb-4';
      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${project.image}" class="card-img-top" alt="${project.name}">
          <div class="card-body">
            <h5 class="card-title">${project.name}</h5>
            <p class="card-text">${project.description.substring(0, 120)}...</p>
            <a href="projects.html" class="stretched-link">Learn more</a>
          </div>
        </div>
      `;
      projectContainer.appendChild(card);
    });
  }
  // Social links in hero
  const socialContainer = document.getElementById('social-links');
  if (socialContainer) {
    socialContainer.innerHTML = '';
    data.basics.profiles.forEach(profile => {
      const a = document.createElement('a');
      a.href = profile.url;
      a.target = '_blank';
      a.className = 'me-3 text-decoration-none';
      // choose icon based on network name
      let iconClass = 'fa-globe';
      const network = profile.network.toLowerCase();
      if (network.includes('github')) iconClass = 'fa-github';
      else if (network.includes('linkedin')) iconClass = 'fa-linkedin';
      else if (network.includes('twitter') || network.includes('x')) iconClass = 'fa-twitter';
      a.innerHTML = `<i class="fab ${iconClass} fa-lg"></i>`;
      socialContainer.appendChild(a);
    });
  }
}

// Populate resume page
async function initResume() {
  const data = await loadData();
  if (!data) return;
  // Basics
  const nameEl = document.getElementById('resume-name');
  if (nameEl) nameEl.textContent = data.basics.name;
  const labelEl = document.getElementById('resume-label');
  if (labelEl) labelEl.textContent = data.basics.label;
  const summaryEl = document.getElementById('resume-summary');
  if (summaryEl) summaryEl.textContent = data.basics.summary;
  // Education timeline
  const eduContainer = document.getElementById('education');
  if (eduContainer) {
    eduContainer.innerHTML = '';
    data.education.forEach(item => {
      const entry = document.createElement('div');
      entry.className = 'timeline-item';
      entry.innerHTML = `
        <span class="timeline-date">${item.startDate} – ${item.endDate}</span>
        <h5 class="mb-1">${item.degree}</h5>
        <p class="mb-0"><strong>${item.institution}</strong>, ${item.location}</p>
        <p class="small text-muted">${item.description}</p>
      `;
      eduContainer.appendChild(entry);
    });
  }
  // Volunteer timeline
  const volContainer = document.getElementById('volunteer');
  if (volContainer) {
    volContainer.innerHTML = '';
    data.volunteer.forEach(item => {
      const entry = document.createElement('div');
      entry.className = 'timeline-item';
      entry.innerHTML = `
        <span class="timeline-date">${item.startDate} – ${item.endDate}</span>
        <h5 class="mb-1">${item.position}</h5>
        <p class="mb-0"><strong>${item.organization}</strong></p>
        <p class="small text-muted">${item.summary}</p>
      `;
      volContainer.appendChild(entry);
    });
  }
  // Awards
  const awardsContainer = document.getElementById('awards');
  if (awardsContainer) {
    awardsContainer.innerHTML = '';
    data.awards.forEach(item => {
      const li = document.createElement('li');
      li.className = 'mb-2';
      li.innerHTML = `<strong>${item.title}</strong> – ${item.date}<br><span class="text-muted small">${item.summary}</span>`;
      awardsContainer.appendChild(li);
    });
  }
  // Skills
  const skillsEl = document.getElementById('resume-skills');
  if (skillsEl) {
    skillsEl.innerHTML = '';
    data.skills.forEach(skill => {
      const li = document.createElement('li');
      li.className = 'list-inline-item me-2 mb-2';
      li.innerHTML = `<span class="badge bg-secondary-subtle text-secondary fw-normal">${skill}</span>`;
      skillsEl.appendChild(li);
    });
  }
  // Languages
  const langEl = document.getElementById('resume-languages');
  if (langEl) {
    langEl.innerHTML = data.languages.map(lang => `<span class="badge bg-info-subtle text-info fw-normal me-2 mb-2">${lang}</span>`).join('');
  }
  // Interests
  const interestsEl = document.getElementById('resume-interests');
  if (interestsEl) {
    interestsEl.innerHTML = data.interests.map(interest => `<span class="badge bg-success-subtle text-success fw-normal me-2 mb-2">${interest}</span>`).join('');
  }
}

// Populate publications page
async function initPublications() {
  const data = await loadData();
  if (!data) return;
  const container = document.getElementById('publications-list');
  if (!container) return;
  container.innerHTML = '';
  data.publications.forEach(pub => {
    const item = document.createElement('div');
    item.className = 'mb-4';
    item.innerHTML = `
      <h5 class="mb-1">${pub.title}</h5>
      <p class="mb-0"><strong>${pub.authors}</strong></p>
      <p class="mb-0 text-muted">${pub.journal}, ${pub.date}</p>
      <p class="small">${pub.summary}</p>
      ${pub.url ? `<a href="${pub.url}" target="_blank">Read more</a>` : ''}
    `;
    container.appendChild(item);
  });
}

// Populate projects page with filtering
async function initProjects() {
  const data = await loadData();
  if (!data) return;
  const container = document.getElementById('projects-container');
  if (!container) return;
  // Build category filter
  const categories = [...new Set(data.projects.map(p => p.category))];
  const filterList = document.getElementById('project-filter');
  if (filterList) {
    filterList.innerHTML = '';
    const allButton = document.createElement('button');
    allButton.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
    allButton.dataset.category = 'all';
    allButton.textContent = 'All';
    filterList.appendChild(allButton);
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary me-2 mb-2';
      btn.dataset.category = cat;
      btn.textContent = cat;
      filterList.appendChild(btn);
    });
    // Add click handler
    filterList.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        const category = e.target.dataset.category;
        populateProjects(data.projects, category);
      }
    });
  }
  // Initial populate
  populateProjects(data.projects, 'all');

  function populateProjects(projects, category) {
    container.innerHTML = '';
    const filtered = category === 'all' ? projects : projects.filter(p => p.category === category);
    if (filtered.length === 0) {
      container.innerHTML = '<p>No projects available.</p>';
      return;
    }
    filtered.forEach(project => {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 mb-4';
      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${project.image}" class="card-img-top" alt="${project.name}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${project.name}</h5>
            <p class="card-text flex-grow-1">${project.description}</p>
            <div class="mt-2">
              ${project.url ? `<a href="${project.url}" class="btn btn-sm btn-primary me-2" target="_blank">Demo</a>` : ''}
              ${project.repo ? `<a href="${project.repo}" class="btn btn-sm btn-outline-secondary" target="_blank">Repo</a>` : ''}
            </div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });
  }
}

// Populate blog page
async function initBlog() {
  const data = await loadData();
  if (!data) return;
  const container = document.getElementById('blog-list');
  if (!container) return;
  container.innerHTML = '';
  data.blogPosts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'mb-4';
    item.innerHTML = `
      <h5 class="mb-1">${post.title}</h5>
      <p class="mb-0 text-muted">${post.date} – <span class="badge bg-light text-dark">${post.tag}</span></p>
      <p class="small">${post.summary}</p>
      ${post.url ? `<a href="${post.url}" target="_blank">Read more</a>` : ''}
    `;
    container.appendChild(item);
  });
}

// Populate interests page
async function initInterests() {
  const data = await loadData();
  if (!data) return;
  const container = document.getElementById('interests-list');
  if (!container) return;
  container.innerHTML = '';
  data.interests.forEach(interest => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = interest;
    container.appendChild(li);
  });
}

// Determine which page is loaded by class on body
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  setupDarkModeToggle();
  if (document.body.classList.contains('page-index')) {
    initIndex();
  } else if (document.body.classList.contains('page-resume')) {
    initResume();
  } else if (document.body.classList.contains('page-publications')) {
    initPublications();
  } else if (document.body.classList.contains('page-projects')) {
    initProjects();
  } else if (document.body.classList.contains('page-blog')) {
    initBlog();
  } else if (document.body.classList.contains('page-interests')) {
    initInterests();
  }
});