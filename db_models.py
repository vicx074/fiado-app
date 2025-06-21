from extensions import db

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20))
    fiado = db.Column(db.Float, default=0.0)
    referencia = db.Column(db.String(100))  # Campo de referência
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

    vendas = db.relationship('Venda', backref='cliente', cascade='all, delete-orphan')

class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco = db.Column(db.Float, nullable=False)
    estoque = db.Column(db.Integer, default=0)

class Venda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data = db.Column(db.DateTime, default=db.func.current_timestamp())
    valor = db.Column(db.Float, default=0.0)  # NOVO CAMPO: valor do fiado puro

    itens = db.relationship('VendaItem', backref='venda', cascade='all, delete-orphan')

class VendaItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey('venda.id'))
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'))
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)

    produto = db.relationship('Produto')
