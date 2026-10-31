// Witch's Hunt v4.1 — versioned, offline-ready static cache, GitHub Pages subpath-safe.
const CACHE="witch-hunt-static-v4-hq";
const FILES=["./", "./assets/backgrounds/forest.webp", "./assets/backgrounds/moon.webp", "./assets/backgrounds/ruins.webp", "./assets/backgrounds/snow.webp", "./assets/enemies/bat.webp", "./assets/enemies/golem.webp", "./assets/enemies/mushroom.webp", "./assets/enemies/shadow.webp", "./assets/enemies/slime.webp", "./assets/enemies/treant.webp", "./assets/enemies/wisp.webp", "./assets/enemies/wolf.webp", "./assets/hero/chibi_00.webp", "./assets/hero/chibi_01.webp", "./assets/hero/chibi_02.webp", "./assets/hero/chibi_03.webp", "./assets/hero/chibi_04.webp", "./assets/hero/chibi_05.webp", "./assets/hero/chibi_06.webp", "./assets/hero/chibi_07.webp", "./assets/hero/chibi_08.webp", "./assets/hero/chibi_09.webp", "./assets/hero/chibi_10.webp", "./assets/hero/chibi_11.webp", "./assets/hero/chibi_12.webp", "./assets/hero/chibi_13.webp", "./assets/hero/chibi_14.webp", "./assets/hero/chibi_15.webp", "./assets/hero/chibi_16.webp", "./assets/hero/chibi_17.webp", "./assets/hero/chibi_18.webp", "./assets/hero/chibi_19.webp", "./assets/hero/chibi_20.webp", "./assets/hero/chibi_21.webp", "./assets/hero/chibi_24.webp", "./assets/hero/chibi_25.webp", "./assets/hero/chibi_26.webp", "./assets/hero/chibi_27.webp", "./assets/hero/chibi_30.webp", "./assets/hero/chibi_31.webp", "./assets/hero/chibi_32.webp", "./assets/hero/chibi_33.webp", "./assets/hero/witch_00.webp", "./assets/hero/witch_01.webp", "./assets/hero/witch_02.webp", "./assets/hero/witch_03.webp", "./assets/hero/witch_04.webp", "./assets/hero/witch_05.webp", "./assets/hero/witch_06.webp", "./assets/hero/witch_07.webp", "./assets/hero/witch_08.webp", "./assets/hero/witch_09.webp", "./assets/hero/witch_10.webp", "./assets/hero/witch_11.webp", "./assets/hero/witch_12.webp", "./assets/hero/witch_13.webp", "./assets/hero/witch_14.webp", "./assets/hero/witch_15.webp", "./assets/hero/witch_16.webp", "./assets/hero/witch_17.webp", "./assets/items/amber_mushroom.webp", "./assets/items/ash.webp", "./assets/items/bloom.webp", "./assets/items/boss_core.webp", "./assets/items/crystal.webp", "./assets/items/dew.webp", "./assets/items/ember.webp", "./assets/items/feather.webp", "./assets/items/frost_flower.webp", "./assets/items/fungus.webp", "./assets/items/leaf.webp", "./assets/items/moon_essence.webp", "./assets/items/moon_shard.webp", "./assets/items/spirit.webp", "./assets/items/star_ice.webp", "./assets/items/wing.webp", "./assets/portraits/witch_01.webp", "./assets/portraits/witch_02.webp", "./assets/portraits/witch_03.webp", "./assets/portraits/witch_04.webp", "./assets/portraits/witch_05.webp", "./assets/ui/cover.webp", "./assets/ui/preview_desktop.webp", "./assets/ui/preview_mobile.webp", "./assets/vfx/arc_00.webp", "./assets/vfx/arc_01.webp", "./assets/vfx/arc_02.webp", "./assets/vfx/arc_03.webp", "./assets/vfx/arc_04.webp", "./assets/vfx/arc_05.webp", "./assets/vfx/arc_06.webp", "./assets/vfx/arc_07.webp", "./assets/vfx/bolt_00.webp", "./assets/vfx/bolt_01.webp", "./assets/vfx/bolt_02.webp", "./assets/vfx/bolt_03.webp", "./assets/vfx/bolt_04.webp", "./assets/vfx/bolt_05.webp", "./assets/vfx/bolt_06.webp", "./assets/vfx/bolt_07.webp", "./assets/vfx/fire_00.webp", "./assets/vfx/fire_01.webp", "./assets/vfx/fire_02.webp", "./assets/vfx/fire_03.webp", "./assets/vfx/fire_04.webp", "./assets/vfx/fire_05.webp", "./assets/vfx/fire_06.webp", "./assets/vfx/fire_07.webp", "./assets/vfx/frost_00.webp", "./assets/vfx/frost_01.webp", "./assets/vfx/frost_02.webp", "./assets/vfx/frost_03.webp", "./assets/vfx/frost_04.webp", "./assets/vfx/frost_05.webp", "./assets/vfx/frost_06.webp", "./assets/vfx/frost_07.webp", "./assets/vfx/heal_00.webp", "./assets/vfx/heal_01.webp", "./assets/vfx/heal_02.webp", "./assets/vfx/heal_03.webp", "./assets/vfx/heal_04.webp", "./assets/vfx/heal_05.webp", "./assets/vfx/heal_06.webp", "./assets/vfx/heal_07.webp", "./assets/vfx/meteor_00.webp", "./assets/vfx/meteor_01.webp", "./assets/vfx/meteor_02.webp", "./assets/vfx/meteor_03.webp", "./assets/vfx/meteor_04.webp", "./assets/vfx/meteor_05.webp", "./assets/vfx/meteor_06.webp", "./assets/vfx/meteor_07.webp", "./assets/vfx/moon_00.webp", "./assets/vfx/moon_01.webp", "./assets/vfx/moon_02.webp", "./assets/vfx/moon_03.webp", "./assets/vfx/moon_04.webp", "./assets/vfx/moon_05.webp", "./assets/vfx/moon_06.webp", "./assets/vfx/moon_07.webp", "./assets/vfx/shield_00.webp", "./assets/vfx/shield_01.webp", "./assets/vfx/shield_02.webp", "./assets/vfx/shield_03.webp", "./assets/vfx/shield_04.webp", "./assets/vfx/shield_05.webp", "./assets/vfx/shield_06.webp", "./assets/vfx/shield_07.webp", "./game.js", "./icons/icon-192.png", "./icons/icon-512.png", "./index.html", "./manifest.webmanifest", "./style.css"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('witch-hunt-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const u=new URL(req.url),scope=new URL(self.registration.scope);
  if(u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
  // Prefer network for document navigations; play offline from the versioned cache.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{
      if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
      return resp;
    }).catch(async()=>{
      const c=await caches.open(CACHE);
      return await c.match(req)||await c.match('./index.html');
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async c=>{
    const cached=await c.match(req);
    if(cached)return cached;
    const resp=await fetch(req);
    if(resp.ok)await c.put(req,resp.clone());
    return resp;
  }));
});
