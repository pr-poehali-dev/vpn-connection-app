import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface ConnectionHistory {
  id: string;
  timestamp: Date;
  duration: number;
  dataUsed: number;
  status: 'success' | 'failed';
  server?: string;
}

interface VPNServer {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  load: number;
}

export default function Index() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [configKey, setConfigKey] = useState('');
  const [autoConnect, setAutoConnect] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [dataUsed, setDataUsed] = useState(0);
  const [history, setHistory] = useState<ConnectionHistory[]>([]);
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null);
  
  const servers: VPNServer[] = [
    { id: '1', country: 'Нидерланды', city: 'Амстердам', flag: '🇳🇱', ping: 15, load: 45 },
    { id: '2', country: 'США', city: 'Нью-Йорк', flag: '🇺🇸', ping: 85, load: 62 },
    { id: '3', country: 'Германия', city: 'Франкфурт', flag: '🇩🇪', ping: 22, load: 38 },
    { id: '4', country: 'Великобритания', city: 'Лондон', flag: '🇬🇧', ping: 28, load: 51 },
    { id: '5', country: 'Франция', city: 'Париж', flag: '🇫🇷', ping: 31, load: 42 },
    { id: '6', country: 'Япония', city: 'Токио', flag: '🇯🇵', ping: 120, load: 55 },
    { id: '7', country: 'Сингапур', city: 'Сингапур', flag: '🇸🇬', ping: 95, load: 48 },
    { id: '8', country: 'Канада', city: 'Торонто', flag: '🇨🇦', ping: 92, load: 40 },
  ];

  useEffect(() => {
    const savedAutoConnect = localStorage.getItem('autoConnect') === 'true';
    setAutoConnect(savedAutoConnect);
    const savedConfig = localStorage.getItem('vpnConfig');
    if (savedConfig) {
      setConfigKey(savedConfig);
    }
    const savedHistory = localStorage.getItem('connectionHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      })));
    }
    const savedServer = localStorage.getItem('selectedServer');
    if (savedServer) {
      setSelectedServer(JSON.parse(savedServer));
    }
    
    if (savedAutoConnect && savedConfig) {
      handleConnect();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
        setDataUsed((prev) => prev + Math.random() * 0.5);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const handleConnect = async () => {
    if (!configKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ключ конфигурации',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedServer) {
      toast({
        title: 'Ошибка',
        description: 'Выберите сервер',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnecting(false);
    setIsConnected(true);
    setConnectionTime(0);
    setDataUsed(0);
    
    toast({
      title: 'Подключено',
      description: `Подключение к ${selectedServer.city}, ${selectedServer.country}`,
    });
  };

  const handleDisconnect = () => {
    const newHistory: ConnectionHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      duration: connectionTime,
      dataUsed: dataUsed,
      status: 'success',
      server: selectedServer ? `${selectedServer.flag} ${selectedServer.city}` : undefined,
    };
    
    const updatedHistory = [newHistory, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem('connectionHistory', JSON.stringify(updatedHistory));
    
    setIsConnected(false);
    setConnectionTime(0);
    setDataUsed(0);
    
    toast({
      title: 'Отключено',
      description: 'VPN соединение разорвано',
    });
  };

  const handleImportConfig = () => {
    if (!configKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите ключ конфигурации',
        variant: 'destructive',
      });
      return;
    }
    
    localStorage.setItem('vpnConfig', configKey);
    toast({
      title: 'Успешно',
      description: 'Конфигурация импортирована',
    });
  };

  const handleAutoConnectToggle = (checked: boolean) => {
    setAutoConnect(checked);
    localStorage.setItem('autoConnect', checked.toString());
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatData = (mb: number) => {
    if (mb < 1000) return `${mb.toFixed(1)} МБ`;
    return `${(mb / 1000).toFixed(2)} ГБ`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <Icon name="Shield" size={32} className="text-primary" />
            <h1 className="text-3xl font-bold">VPN Connect</h1>
          </div>
          <p className="text-muted-foreground">Безопасное подключение одним нажатием</p>
        </div>

        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">
              <Icon name="Power" size={16} className="mr-2" />
              Подключение
            </TabsTrigger>
            <TabsTrigger value="import">
              <Icon name="Download" size={16} className="mr-2" />
              Импорт
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Icon name="Settings" size={16} className="mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="history">
              <Icon name="Clock" size={16} className="mr-2" />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon name="Globe" size={18} />
                Выбор сервера
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      setSelectedServer(server);
                      localStorage.setItem('selectedServer', JSON.stringify(server));
                      toast({
                        title: 'Сервер выбран',
                        description: `${server.city}, ${server.country}`,
                      });
                    }}
                    disabled={isConnected}
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:border-primary ${
                      selectedServer?.id === server.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/30'
                    } ${isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{server.flag}</span>
                        <div>
                          <p className="font-semibold">{server.city}</p>
                          <p className="text-sm text-muted-foreground">{server.country}</p>
                        </div>
                      </div>
                      {selectedServer?.id === server.id && (
                        <Icon name="CheckCircle2" size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Icon name="Activity" size={14} className="text-muted-foreground" />
                        <span>{server.ping}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="BarChart3" size={14} className="text-muted-foreground" />
                        <span>{server.load}% загрузка</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div
                    className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isConnected
                        ? 'bg-primary/20 animate-pulse-glow'
                        : 'bg-muted'
                    }`}
                  >
                    <Button
                      size="lg"
                      onClick={isConnected ? handleDisconnect : handleConnect}
                      disabled={isConnecting}
                      className={`w-32 h-32 rounded-full text-lg font-semibold transition-all duration-300 ${
                        isConnected
                          ? 'bg-destructive hover:bg-destructive/90'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {isConnecting ? (
                        <Icon name="Loader2" size={32} className="animate-spin" />
                      ) : isConnected ? (
                        <div className="flex flex-col items-center">
                          <Icon name="PowerOff" size={32} />
                          <span className="text-sm mt-2">Отключить</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Icon name="Power" size={32} />
                          <span className="text-sm mt-2">Подключить</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-semibold mb-2">
                    {isConnecting
                      ? 'Подключение...'
                      : isConnected
                      ? 'Подключено'
                      : 'Отключено'}
                  </p>
                  <p className="text-muted-foreground">
                    {isConnected && selectedServer ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{selectedServer.flag}</span>
                        {selectedServer.city}, {selectedServer.country}
                      </span>
                    ) : isConnected ? (
                      'Защищённое соединение активно'
                    ) : selectedServer ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">{selectedServer.flag}</span>
                        {selectedServer.city}, {selectedServer.country}
                      </span>
                    ) : (
                      'Выберите сервер и нажмите для подключения'
                    )}
                  </p>
                </div>

                {isConnected && (
                  <div className="grid grid-cols-2 gap-6 w-full mt-8 animate-fade-in">
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="Clock" size={24} className="text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Время</p>
                          <p className="text-xl font-semibold">{formatTime(connectionTime)}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="Activity" size={24} className="text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Данные</p>
                          <p className="text-xl font-semibold">{formatData(dataUsed)}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon name="Key" size={20} />
                Импорт конфигурации
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="config-key">Ключ конфигурации</Label>
                  <Textarea
                    id="config-key"
                    placeholder="Вставьте ваш ключ конфигурации VPN здесь..."
                    value={configKey}
                    onChange={(e) => setConfigKey(e.target.value)}
                    className="mt-2 min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button onClick={handleImportConfig} className="w-full" size="lg">
                  <Icon name="Download" size={20} className="mr-2" />
                  Импортировать конфигурацию
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Вставьте ключ конфигурации от вашего VPN-провайдера
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Icon name="Settings" size={20} />
                Настройки приложения
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="auto-connect" className="text-base font-medium">
                      Автоподключение
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Подключаться автоматически при запуске приложения
                    </p>
                  </div>
                  <Switch
                    id="auto-connect"
                    checked={autoConnect}
                    onCheckedChange={handleAutoConnectToggle}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Статус конфигурации</h3>
                  <div className="flex items-center gap-2">
                    {configKey ? (
                      <>
                        <Icon name="CheckCircle2" size={16} className="text-primary" />
                        <span className="text-sm">Конфигурация загружена</span>
                      </>
                    ) : (
                      <>
                        <Icon name="AlertCircle" size={16} className="text-destructive" />
                        <span className="text-sm">Конфигурация не найдена</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 animate-fade-in">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Icon name="History" size={20} />
                История подключений
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="CloudOff" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">История подключений пуста</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'success' ? 'bg-primary' : 'bg-destructive'
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {item.timestamp.toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.timestamp.toLocaleTimeString('ru-RU')}
                            {item.server && ` • ${item.server}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatTime(item.duration)}</p>
                        <p className="text-sm text-muted-foreground">{formatData(item.dataUsed)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}