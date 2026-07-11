(() => {
  const collectedAt = '2026-07-11T00:00:00+09:00';
  const itemOverrides = [
    {
      id: 24,
      name: '붕어빵 뿌리기 11개',
      category: '마일리지',
      cashPrice: 2000,
      seedMesoPrice: 82000000,
      mileageType: 'full',
      aliases: ['붕어빵', '붕어빵 11개', '붕어빵 뿌리기']
    },
    {
      id: 25,
      name: '달콤한 붕어빵 11개',
      category: '마일리지',
      cashPrice: 4000,
      seedMesoPrice: 159000000,
      mileageType: 'full',
      aliases: ['달콤한 붕어빵']
    },
    {
      id: 26,
      name: '슈퍼파워버프',
      category: '마일리지',
      cashPrice: 3000,
      seedMesoPrice: 132000000,
      mileageType: 'full',
      aliases: ['슈퍼파워 버프']
    },
    {
      id: 27,
      name: '마슈르의 선물기상효과',
      category: '마일리지',
      cashPrice: 3000,
      seedMesoPrice: 135000000,
      mileageType: 'full',
      aliases: ['마슈르의 선물 기상효과']
    }
  ];

  const priceOverrides = [
    {
      itemName: '붕어빵 뿌리기 11개',
      query: '붕어빵',
      aliases: ['붕어빵', '붕어빵 11개', '붕어빵 뿌리기'],
      listingLowestMeso: 82000000,
      listingLowestText: '8200만',
      status: 'manual',
      source: 'manual',
      filter: '캐시',
      collectedAt
    },
    {
      itemName: '달콤한 붕어빵 11개',
      query: '달콤한 붕어빵',
      aliases: ['달콤한 붕어빵'],
      listingLowestMeso: 159000000,
      listingLowestText: '1억 5900만',
      status: 'manual',
      source: 'manual',
      filter: '캐시',
      collectedAt
    },
    {
      itemName: '슈퍼파워버프',
      query: '슈퍼파워버프',
      aliases: ['슈퍼파워 버프'],
      listingLowestMeso: 132000000,
      listingLowestText: '1억 3200만',
      status: 'manual',
      source: 'manual',
      filter: '캐시',
      collectedAt
    },
    {
      itemName: '마슈르의 선물기상효과',
      query: '마슈르의 선물기상효과',
      aliases: ['마슈르의 선물 기상효과'],
      listingLowestMeso: 135000000,
      listingLowestText: '1억 3500만',
      status: 'manual',
      source: 'manual',
      filter: '캐시',
      collectedAt
    }
  ];

  function normalizeKey(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
  }

  function mergeByNameOrId(base, overrides) {
    const output = Array.isArray(base) ? [...base] : [];
    for (const override of overrides) {
      const overrideKey = normalizeKey(override.itemName || override.name);
      const index = output.findIndex(item => {
        if (override.id != null && item.id === override.id) return true;
        const names = [item.itemName, item.name, item.query, ...(item.aliases || [])].filter(Boolean);
        return names.some(name => normalizeKey(name) === overrideKey);
      });
      if (index >= 0) {
        output[index] = { ...output[index], ...override };
      } else {
        output.push(override);
      }
    }
    return output;
  }

  function removeSkipped(skipped, overrides) {
    if (!Array.isArray(skipped)) return [];
    const overrideKeys = new Set(overrides.flatMap(override => [
      override.itemName,
      override.name,
      override.query,
      ...(override.aliases || [])
    ].filter(Boolean).map(normalizeKey)));
    return skipped.filter(row => {
      const names = [row.itemName, row.name, row.query, ...(row.aliases || [])].filter(Boolean).map(normalizeKey);
      return !names.some(name => overrideKeys.has(name));
    });
  }

  function responseFromJson(response, body) {
    return new Response(JSON.stringify(body, null, 2), {
      status: response.status,
      statusText: response.statusText,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const rawUrl = typeof input === 'string' ? input : input?.url || '';
    if (!response.ok || !/data\/(items|auction-prices)\.json/.test(rawUrl)) return response;

    const doc = await response.clone().json();
    if (rawUrl.includes('data/items.json')) {
      return responseFromJson(response, {
        ...doc,
        version: Math.max(Number(doc.version || 0), 4),
        updatedAt: collectedAt,
        items: mergeByNameOrId(doc.items, itemOverrides)
      });
    }

    if (rawUrl.includes('data/auction-prices.json')) {
      return responseFromJson(response, {
        ...doc,
        version: Math.max(Number(doc.version || 0), 3),
        generatedAt: collectedAt,
        prices: mergeByNameOrId(doc.prices, priceOverrides),
        skipped: removeSkipped(doc.skipped, priceOverrides)
      });
    }

    return response;
  };
})();
