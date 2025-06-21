import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models.usuario import Usuario

# Chave secreta para JWT (em produção, usar variável de ambiente)
SECRET_KEY = 'sua_chave_secreta_aqui'

def gerar_token(usuario_id):
    """Gera um token JWT para o usuário"""
    return jwt.encode(
        {
            'user_id': usuario_id,
            'exp': datetime.utcnow() + timedelta(days=1)  # Token expira em 1 dia
        },
        SECRET_KEY,
        algorithm='HS256'
    )

def token_required(f):
    """Decorador para verificar token JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token ausente!'}), 401

        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' do token
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = Usuario.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'Token inválido!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido!'}), 401

        return f(current_user, *args, **kwargs)
    
    return decorated
