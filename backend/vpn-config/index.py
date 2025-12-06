import json
import re
import base64
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class VPNConfig:
    interface_private_key: str
    interface_address: str
    interface_dns: Optional[str]
    peer_public_key: str
    peer_endpoint: str
    peer_allowed_ips: str
    peer_persistent_keepalive: Optional[int]

def parse_wireguard_config(config_text: str) -> Optional[VPNConfig]:
    lines = config_text.strip().split('\n')
    config_data = {}
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        if line.startswith('[') and line.endswith(']'):
            current_section = line[1:-1].lower()
            continue
            
        if '=' in line:
            key, value = line.split('=', 1)
            key = key.strip().lower().replace(' ', '_')
            value = value.strip()
            
            if current_section:
                full_key = f"{current_section}_{key}"
                config_data[full_key] = value
    
    required_keys = [
        'interface_privatekey',
        'interface_address',
        'peer_publickey',
        'peer_endpoint',
        'peer_allowedips'
    ]
    
    for key in required_keys:
        if key not in config_data:
            return None
    
    try:
        return VPNConfig(
            interface_private_key=config_data['interface_privatekey'],
            interface_address=config_data['interface_address'],
            interface_dns=config_data.get('interface_dns'),
            peer_public_key=config_data['peer_publickey'],
            peer_endpoint=config_data['peer_endpoint'],
            peer_allowed_ips=config_data['peer_allowedips'],
            peer_persistent_keepalive=int(config_data['peer_persistentkeepalive']) 
                if 'peer_persistentkeepalive' in config_data else None
        )
    except (KeyError, ValueError):
        return None

def validate_wireguard_key(key: str) -> bool:
    if not key or len(key) < 40 or len(key) > 45:
        return False
    try:
        key_clean = key.rstrip('=')
        padding = (4 - len(key_clean) % 4) % 4
        key_padded = key_clean + '=' * padding
        decoded = base64.b64decode(key_padded)
        return len(decoded) == 32
    except Exception:
        return False

def validate_endpoint(endpoint: str) -> bool:
    pattern = r'^[\w\.\-]+:\d+$'
    return bool(re.match(pattern, endpoint))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'parse')
        config_text = body_data.get('config', '')
        
        if action == 'parse':
            if not config_text:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Конфигурация не предоставлена'
                    }),
                    'isBase64Encoded': False
                }
            
            parsed_config = parse_wireguard_config(config_text)
            
            if not parsed_config:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Неверный формат конфигурации WireGuard'
                    }),
                    'isBase64Encoded': False
                }
            
            if not validate_wireguard_key(parsed_config.peer_public_key):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Неверный публичный ключ'
                    }),
                    'isBase64Encoded': False
                }
            
            if not validate_endpoint(parsed_config.peer_endpoint):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Неверный формат endpoint'
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'config': {
                        'endpoint': parsed_config.peer_endpoint,
                        'address': parsed_config.interface_address,
                        'dns': parsed_config.interface_dns,
                        'allowed_ips': parsed_config.peer_allowed_ips
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'validate':
            if not config_text:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': False,
                        'valid': False,
                        'error': 'Конфигурация не предоставлена'
                    }),
                    'isBase64Encoded': False
                }
            
            parsed_config = parse_wireguard_config(config_text)
            is_valid = parsed_config is not None
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'valid': is_valid
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Неизвестное действие'
            }),
            'isBase64Encoded': False
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Неверный JSON'
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }