import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Tv, 
  Printer, 
  HardDrive, 
  Zap, 
  Monitor, 
  Wifi, 
  Car,
  Search,
  Settings,
  Download,
  Upload,
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  symptoms: string[];
  tests: Test[];
}

interface Test {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
  value?: string;
  location: string;
  status: 'ok' | 'faulty' | 'unknown';
}

const App: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [testResults, setTestResults] = useState<Test[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<string>('');

  const devices = [
    { id: 'laptop', name: 'Notebook', icon: Laptop, color: 'bg-blue-500' },
    { id: 'tv', name: 'Televisor', icon: Tv, color: 'bg-purple-500' },
    { id: 'printer', name: 'Impressora', icon: Printer, color: 'bg-green-500' },
    { id: 'ssd', name: 'SSD', icon: HardDrive, color: 'bg-orange-500' },
    { id: 'psu', name: 'Fonte de Alimentação', icon: Zap, color: 'bg-red-500' },
    { id: 'monitor', name: 'Monitor', icon: Monitor, color: 'bg-indigo-500' },
    { id: 'router', name: 'Roteador', icon: Wifi, color: 'bg-yellow-500' },
    { id: 'automotive', name: 'Sistema Automotivo', icon: Car, color: 'bg-gray-500' }
  ];

  const testTemplates: Record<string, Test[]> = {
    laptop: [
      { id: 'power', name: 'Teste de Alimentação', description: 'Verifica fonte e bateria', status: 'pending' },
      { id: 'display', name: 'Teste de Display', description: 'Verifica LCD/LED', status: 'pending' },
      { id: 'keyboard', name: 'Teste de Teclado', description: 'Verifica todas as teclas', status: 'pending' },
      { id: 'ports', name: 'Teste de Portas', description: 'Verifica USB, HDMI, etc', status: 'pending' }
    ],
    tv: [
      { id: 'backlight', name: 'Teste de Backlight', description: 'Verifica iluminação', status: 'pending' },
      { id: 'tcon', name: 'Teste T-CON', description: 'Verifica placa de controle', status: 'pending' },
      { id: 'power', name: 'Teste de Alimentação', description: 'Verifica fonte interna', status: 'pending' }
    ],
    psu: [
      { id: 'voltage', name: 'Teste de Tensão', description: 'Verifica saídas +12V, +5V, +3.3V', status: 'pending' },
      { id: 'ripple', name: 'Teste de Ripple', description: 'Verifica estabilidade', status: 'pending' },
      { id: 'protection', name: 'Teste de Proteção', description: 'Verifica circuitos de segurança', status: 'pending' }
    ]
  };

  const runTest = async (test: Test) => {
    setIsRunning(true);
    setCurrentTest(test);
    
    // Simulação de teste
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedTest = {
      ...test,
      status: Math.random() > 0.3 ? 'passed' : 'failed' as 'passed' | 'failed',
      result: Math.random() > 0.3 ? 'Componente OK' : 'Falha detectada'
    };
    
    setTestResults(prev => [...prev.filter(t => t.id !== test.id), updatedTest]);
    setIsRunning(false);
    setCurrentTest(null);
  };

  const runAllTests = async () => {
    if (!selectedDevice) return;
    
    const tests = testTemplates[selectedDevice] || [];
    for (const test of tests) {
      await runTest(test);
    }
  };

  const generateReport = () => {
    const reportText = `
RELATÓRIO DE DIAGNÓSTICO - ${new Date().toLocaleString('pt-BR')}
=====================================================
Dispositivo: ${devices.find(d => d.id === selectedDevice)?.name || 'Não especificado'}
Status: ${testResults.every(t => t.status === 'passed') ? 'APROVADO' : 'REPARO NECESSÁRIO'}

RESULTADOS DOS TESTES:
${testResults.map(t => `
- ${t.name}: ${t.status === 'passed' ? '✅' : '❌'} ${t.result || ''}
`).join('')}

COMPONENTES VERIFICADOS:
${components.map(c => `
- ${c.name} (${c.location}): ${c.status === 'ok' ? 'OK' : 'FALHA'}
`).join('')}

RECOMENDAÇÕES:
${testResults.filter(t => t.status === 'failed').map(t => `
- ${t.name}: ${t.description}
`).join('') || 'Nenhuma recomendação necessária'}
    `;
    
    setReport(reportText);
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico-${selectedDevice}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">Hardware Repair System</h1>
                <p className="text-sm text-gray-400">Diagnóstico Inteligente de Hardware</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={generateReport}
                disabled={testResults.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
              >
                <Save className="w-4 h-4" />
                <span>Gerar Relatório</span>
              </button>
              <button
                onClick={downloadReport}
                disabled={!report}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>Baixar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seleção de Dispositivo */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Selecione o Dispositivo</h2>
            <div className="grid grid-cols-2 gap-3">
              {devices.map((device) => {
                const Icon = device.icon;
                return (
                  <button
                    key={device.id}
                    onClick={() => {
                      setSelectedDevice(device.id);
                      setTestResults([]);
                      setReport('');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDevice === device.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{device.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área de Testes */}
          <div className="lg:col-span-2">
            {selectedDevice ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Testes para {devices.find(d => d.id === selectedDevice)?.name}
                  </h2>
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg"
                  >
                    <RotateCcw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>{isRunning ? 'Executando...' : 'Executar Todos'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(testTemplates[selectedDevice] || []).map((test) => (
                    <div
                      key={test.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <p className="text-sm text-gray-400">{test.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {testResults.find(t => t.id === test.id) ? (
                            <div className="flex items-center space-x-2">
                              {testResults.find(t => t.id === test.id)?.status === 'passed' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <span className="text-sm">
                                {testResults.find(t => t.id === test.id)?.result}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => runTest(test)}
                              disabled={isRunning}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
                            >
                              Executar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Relatório */}
                {report && (
                  <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Relatório de Diagnóstico
                    </h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">{report}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Selecione um dispositivo para iniciar o diagnóstico</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
