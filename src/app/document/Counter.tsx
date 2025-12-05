// Minimal client component to test hydration
'use client';

import { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <p>Counter: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
    );
}
