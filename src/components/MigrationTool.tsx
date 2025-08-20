import { useState } from 'react'
import { firebaseAuthService } from '../services/firebaseAuthService'

export default function MigrationTool() {
  const [migrating, setMigrating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleMigrate = async () => {
    setMigrating(true)
    setShowResults(false)
    
    try {
      const migrationResults = await firebaseAuthService.migrateAllStudents()
      setResults(migrationResults)
      setShowResults(true)
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '2px solid #e2e8f0',
      maxWidth: '400px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
        🚀 Student Migration Tool
      </h3>
      
      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#4a5568' }}>
        This will migrate all students from students.json to Firebase automatically.
      </p>
      
      <button
        onClick={handleMigrate}
        disabled={migrating}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: migrating ? '#a0aec0' : '#4299e1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: migrating ? 'not-allowed' : 'pointer',
          marginBottom: '15px'
        }}
      >
        {migrating ? '🔄 Migrating Students...' : '✅ Migrate All Students'}
      </button>

      {showResults && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#f7fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '14px' }}>
            Migration Results:
          </h4>
          
          <div style={{ fontSize: '12px' }}>
            {results.map((result, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: index < results.length - 1 ? '1px solid #e2e8f0' : 'none'
              }}>
                <span style={{ color: '#4a5568' }}>
                  {result.matricNumber}
                </span>
                <span style={{
                  color: result.success ? '#38a169' : '#e53e3e',
                  fontWeight: 'bold'
                }}>
                  {result.success ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: '#c6f6d5',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#2f855a',
            fontWeight: 'bold'
          }}>
            {results.filter(r => r.success).length}/{results.length} students migrated successfully!
          </div>
        </div>
      )}
      
      <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#a0aec0' }}>
        Note: Students can also be migrated automatically on their first login.
      </p>
    </div>
  )
}
