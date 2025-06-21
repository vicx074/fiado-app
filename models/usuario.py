from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    estabelecimento = db.Column(db.String(100), nullable=False)
    data_criacao = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relacionamentos
    clientes = db.relationship('Cliente', backref='usuario', lazy=True)
    vendas = db.relationship('Venda', backref='usuario', lazy=True)

    def definir_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def verificar_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'estabelecimento': self.estabelecimento
        }
