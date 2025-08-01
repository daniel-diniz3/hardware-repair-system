import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Camera, ZoomIn, ZoomOut, Circle, Square, Trash, Eye, EyeOff, Layers, AlertCircle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Annotation, PCBAnalysis } from '@/types/pcb-analysis';

const PCBVisualAnalysis: React.FC = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<PCBAnalysis | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<'circle' | 'rectangle' | 'select'>('select');
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation>>({
    type: 'damage',
    severity: 'medium',
    label: '',
    notes: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const severityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const drawAnnotations = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!currentAnalysis) return;

    currentAnalysis.annotations.forEach(annotation => {
      ctx.strokeStyle = severityColors[annotation.severity];
      ctx.lineWidth = 2;
      ctx.fillStyle = `${severityColors[annotation.severity]}33`;

      if (annotation.type === 'damage' || annotation.type === 'component') {
        if (annotation.radius) {
          ctx.beginPath();
          ctx.arc(annotation.x, annotation.y, annotation.radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else if (annotation.width && annotation.height) {
          ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        }
      }
    });
  }, [currentAnalysis, severityColors]);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    if (showAnnotations && currentAnalysis) {
      drawAnnotations(ctx);
    }
  }, [zoom, showAnnotations, showGrid, currentAnalysis, drawGrid, drawAnnotations]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const newAnalysis: PCBAnalysis = {
          imageUrl: e.target?.result as string,
          annotations: [],
          metadata: {
            resolution: `${img.width}x${img.height}`,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            format: file.type.split('/')[1].toUpperCase(),
            uploadDate: new Date()
          }
        };
        setCurrentAnalysis(newAnalysis);
        drawImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [drawImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentAnalysis) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (selectedTool === 'select') {
      const clickedAnnotation = currentAnalysis.annotations.find(ann => {
        if (ann.radius) {
          const distance = Math.sqrt((x - ann.x) ** 2 + (y - ann.y) ** 2);
          return distance <= ann.radius;
        }
        return false;
      });
      setSelectedAnnotation(clickedAnnotation || null);
    }
  }, [currentAnalysis, selectedTool, zoom]);

  const addAnnotation = useCallback(() => {
    if (!currentAnalysis || !currentAnnotation.x || !currentAnnotation.y) return;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentAnnotation.type || 'damage',
      x: currentAnnotation.x,
      y: currentAnnotation.y,
      width: currentAnnotation.width,
      height: currentAnnotation.height,
      radius: currentAnnotation.radius,
      label: currentAnnotation.label || 'Nova Anotação',
      severity: currentAnnotation.severity || 'medium',
      notes: currentAnnotation.notes || ''
    };

    setCurrentAnalysis({
      ...currentAnalysis,
      annotations: [...currentAnalysis.annotations, newAnnotation]
    });

    setCurrentAnnotation({
      type: 'damage',
      severity: 'medium',
      label: '',
      notes: ''
    });
  }, [currentAnalysis, currentAnnotation]);

  const deleteAnnotation = useCallback((id: string) => {
    if (!currentAnalysis) return;
    
    setCurrentAnalysis({
      ...currentAnalysis,
      annotations: currentAnalysis.annotations.filter(ann => ann.id !== id)
    });
    setSelectedAnnotation(null);
  }, [currentAnalysis]);

  const exportAnalysis = useCallback(() => {
    if (!currentAnalysis) return;

    const data = {
      analysis: currentAnalysis,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcb-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentAnalysis]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useEffect(() => {
    if (currentAnalysis) {
      const img = new Image();
      img.onload = () => drawImage(img);
      img.src = currentAnalysis.imageUrl;
    }
  }, [currentAnalysis, zoom, showAnnotations, showGrid, drawImage]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Análise Visual de PCB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Painel de Controles */}
              <div className="lg:col-span-1 space-y-4">
                {/* Upload */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Upload de Imagem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Imagem
                    </Button>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="mt-2 p-4 border-2 border-dashed border-gray-600 rounded-lg text-center text-sm text-gray-400"
                    >
                      Ou arraste uma imagem aqui
                    </div>
                  </CardContent>
                </Card>

                {/* Ferramentas */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Ferramentas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant={selectedTool === 'select' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('select')}
                        className="flex-1"
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedTool === 'circle' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('circle')}
                        className="flex-1"
                      >
                        <Circle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('rectangle')}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Controles de Visualização */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Visualização</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">Zoom: {Math.round(zoom * 100)}%</Label>
                      <Slider
                        value={[zoom]}
                        onValueChange={([value]) => setZoom(value)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={resetZoom}
                        className="flex-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={showAnnotations ? 'default' : 'outline'}
                        onClick={() => setShowAnnotations(!showAnnotations)}
                        className="flex-1"
                      >
                        {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant={showGrid ? 'default' : 'outline'}
                        onClick={() => setShowGrid(!showGrid)}
                        className="flex-1"
                      >
                        <Layers className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Exportar */}
                {currentAnalysis && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Exportar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={exportAnalysis}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Análise
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Canvas e Anotações */}
              <div className="lg:col-span-3 space-y-4">
                {/* Canvas */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    {currentAnalysis ? (
                      <div className="overflow-auto max-h-[600px]">
                        <canvas
                          ref={canvasRef}
                          onClick={handleCanvasClick}
                          className="border border-gray-600 rounded cursor-crosshair"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                    ) : (
                      <div className="h-96 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Carregue uma imagem para começar a análise</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Metadados */}
                {currentAnalysis && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Metadados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Resolução:</span>
                          <p>{currentAnalysis.metadata.resolution}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Tamanho:</span>
                          <p>{currentAnalysis.metadata.size}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Formato:</span>
                          <p>{currentAnalysis.metadata.format}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Upload:</span>
                          <p>{currentAnalysis.metadata.uploadDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de Anotações */}
                {currentAnalysis && currentAnalysis.annotations.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Anotações ({currentAnalysis.annotations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {currentAnalysis.annotations.map(annotation => (
                          <div
                            key={annotation.id}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={severityColors[annotation.severity]}>
                                {annotation.severity}
                              </Badge>
                              <span>{annotation.label}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAnnotation(annotation.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PCBVisualAnalysis;
