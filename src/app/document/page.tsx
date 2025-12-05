// Server Component with embedded Client Component
import Counter from './Counter';

export default function DocumentPage() {
    return (
        <div style={{
            padding: '40px',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <h1 style={{ marginBottom: '20px' }}>Document Page</h1>
            <p style={{ marginBottom: '10px' }}>This is a Server Component with a Client Component embedded</p>
            <p style={{ color: 'green' }}>✓ Server part loaded!</p>

            {/* Client Component that requires hydration */}
            <Counter />
        </div>
    );
}
