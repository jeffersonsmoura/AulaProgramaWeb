
document.addEventListener('DOMContentLoaded', () => {
  // Utilidade: mostrar notificação temporária
  function notify(msg, timeout=2500){
    let n = document.createElement('div');
    n.className = 'site-notify';
    n.textContent = msg;
    Object.assign(n.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      background: '#222',
      color: '#fff',
      padding: '10px 14px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(n);
    setTimeout(()=> n.remove(), timeout);
  }

  // ======= Formulário de cadastro (cadastro.html) =======
  const form = document.querySelector('form#cadastroForm') || document.querySelector('form');
  if(form && form.id === 'cadastroForm' || form && document.title && document.title.toLowerCase().includes('cadastro')){
    // Ensure form has id cadastroForm
    if(form && !form.id) form.id = 'cadastroForm';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Gather values with fallbacks
      const nome = form.querySelector('[name="nome"]')?.value?.trim() || form.querySelector('#nome')?.value?.trim();
      const email = form.querySelector('[name="email"]')?.value?.trim() || '';
      const telefone = form.querySelector('[name="telefone"]')?.value?.trim() || '';
      const tipo = form.querySelector('[name="tipo"]')?.value || '';
      const mensagem = form.querySelector('[name="mensagem"]')?.value?.trim() || '';

      // Simple validation
      if(!nome || !email){
        notify('Por favor preencha nome e e-mail.');
        return;
      }
      // Email basic regex
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if(!emailOk){
        notify('Endereço de e-mail inválido.');
        return;
      }

      // Save to localStorage
      const storageKey = 'ong_cadastros';
      const arr = JSON.parse(localStorage.getItem(storageKey) || '[]');
      arr.push({nome,email,telefone,tipo,mensagem,created: new Date().toISOString()});
      localStorage.setItem(storageKey, JSON.stringify(arr));
      notify('Cadastro enviado! Obrigado por ajudar 🧡');
      form.reset();
    });
  }

  // ======= Galeria / Lista de animais (index.html & projeto.html) =======
  // Default animals if none in storage
  const defaultAnimals = [
    {id: 'a1', nome: 'Rex', especie: 'Cachorro', idade: '3 anos', genero:'Macho', desc:'Amigável e brincalhão', foto:'', status:'available'},
    {id: 'a2', nome: 'Mimi', especie: 'Gato', idade: '2 anos', genero:'Fêmea', desc:'Carinhosa e calma', foto:'', status:'available'},
    {id: 'a3', nome: 'Luna', especie: 'Cachorro', idade: '1 ano', genero:'Fêmea', desc:'Enérgica e doce', foto:'', status:'available'},
    {id: 'a4', nome: 'Bob', especie: 'Coelho', idade: '6 meses', genero:'Macho', desc:'Curioso e tranquilo', foto:'', status:'available'}
  ];

  function getAnimals(){
    const key = 'ong_animais';
    const raw = localStorage.getItem(key);
    if(!raw) {
      localStorage.setItem(key, JSON.stringify(defaultAnimals));
      return defaultAnimals.slice();
    }
    try {
      return JSON.parse(raw);
    } catch(e){
      localStorage.setItem(key, JSON.stringify(defaultAnimals));
      return defaultAnimals.slice();
    }
  }
  function saveAnimals(arr){
    localStorage.setItem('ong_animais', JSON.stringify(arr));
  }

  function renderGallery(container){
    if(!container) return;
    const animals = getAnimals();
    container.innerHTML = '';
    if(animals.length === 0){
      container.innerHTML = '<p>Nenhum animal disponível.</p>';
      return;
    }
    animals.forEach(a => {
      const card = document.createElement('article');
      card.className = 'animal-card';
      card.innerHTML = `
        <div class="foto">${a.foto ? `<img src="${a.foto}" alt="${a.nome}">` : '<div class="placeholder">Sem foto</div>'}</div>
        <div class="info">
          <h3>${a.nome} <small>(${a.especie})</small></h3>
          <p>${a.desc || ''}</p>
          <p><strong>Idade:</strong> ${a.idade || '—'}</p>
          <p><strong>Gênero:</strong> ${a.genero || '—'}</p>
          <div class="acoes">
            ${a.status === 'available' ? `<button class="btn-adotar" data-id="${a.id}">Adotar</button>` : `<span class="adotado">Adotado</span>`}
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // attach adopt handlers
    container.querySelectorAll('.btn-adotar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        adoptAnimal(id, container);
      });
    });
  }

  function adoptAnimal(id, container){
    const arr = getAnimals();
    const idx = arr.findIndex(x => x.id === id);
    if(idx === -1){ notify('Animal não encontrado.'); return; }
    if(arr[idx].status === 'adopted'){ notify('Esse animal já foi adotado.'); return; }
    arr[idx].status = 'adopted';
    saveAnimals(arr);
    // move to adotados list
    const adotadosKey = 'ong_adotados';
    const adotados = JSON.parse(localStorage.getItem(adotadosKey) || '[]');
    adotados.push(Object.assign({}, arr[idx], {adotadoEm: new Date().toISOString()}));
    localStorage.setItem(adotadosKey, JSON.stringify(adotados));
    notify(`Parabéns! Você adotou ${arr[idx].nome} 🐾`);
    // re-render gallery if provided
    if(container) renderGallery(container);
  }

  // Render on pages
  const galleryEl = document.getElementById('lista-animais') || document.querySelector('.galeria-animais');
  if(galleryEl) renderGallery(galleryEl);

  // Filter by species if filter element exists
  const filter = document.getElementById('filter-especie');
  if(filter){
    // populate options
    const animals = getAnimals();
    const especies = Array.from(new Set(animals.map(a => a.especie))).sort();
    especies.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      filter.appendChild(opt);
    });
    filter.addEventListener('change', () => {
      const val = filter.value;
      const all = getAnimals();
      const filtered = val === 'all' ? all : all.filter(a => a.especie === val);
      // render filtered
      galleryEl.innerHTML = '';
      filtered.forEach(a => {
        const card = document.createElement('article');
        card.className = 'animal-card';
        card.innerHTML = `
          <div class="foto">${a.foto ? `<img src="${a.foto}" alt="${a.nome}">` : '<div class="placeholder">Sem foto</div>'}</div>
          <div class="info">
            <h3>${a.nome} <small>(${a.especie})</small></h3>
            <p>${a.desc || ''}</p>
            <div class="acoes">
              ${a.status === 'available' ? `<button class="btn-adotar" data-id="${a.id}">Adotar</button>` : `<span class="adotado">Adotado</span>`}
            </div>
          </div>
        `;
        galleryEl.appendChild(card);
      });
      // re-hook adopt buttons
      galleryEl.querySelectorAll('.btn-adotar').forEach(btn => {
        btn.addEventListener('click', (e) => {
          adoptAnimal(btn.getAttribute('data-id'), galleryEl);
        });
      });
    });
  }

  // ======= Página de projeto: permitir adicionar animal (simulação) =======
  const addForm = document.getElementById('adicionarAnimalForm');
  if(addForm){
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = addForm.querySelector('[name="nome"]')?.value?.trim();
      const especie = addForm.querySelector('[name="especie"]')?.value?.trim();
      const idade = addForm.querySelector('[name="idade"]')?.value?.trim();
      const genero = addForm.querySelector('[name="genero"]')?.value?.trim();
      const desc = addForm.querySelector('[name="desc"]')?.value?.trim();
      const foto = addForm.querySelector('[name="foto"]')?.value?.trim();

      if(!nome || !especie){ notify('Nome e espécie são obrigatórios.'); return; }

      const arr = getAnimals();
      const id = 'a' + Math.random().toString(36).slice(2,9);
      arr.push({id,nome,especie,idade,genero,desc,foto,status:'available'});
      saveAnimals(arr);
      notify(`${nome} adicionado à lista!`);
      addForm.reset();
      // re-render gallery if on same page
      if(galleryEl) renderGallery(galleryEl);
    });
  }

  // Small keyboard shortcut: Press "L" to listar cadastros no console (dev tool)
  document.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase() === 'l' && (e.ctrlKey || e.metaKey)){
      console.log('Cadastros:', JSON.parse(localStorage.getItem('ong_cadastros') || '[]'));
      console.log('Animais:', getAnimals());
      notify('Dados impressos no console do navegador (Ctrl/Cmd+L).',1500);
    }
  });

});
