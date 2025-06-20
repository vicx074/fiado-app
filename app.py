import os
from flask import Flask, request, jsonify
from extensions import db, ma
from models import Cliente, Produto, Venda, VendaItem
from schemas import ClienteSchema

app = Flask(__name__)

# Configurações do banco de dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)

db_path = os.path.join(instance_path, 'database.db').replace("\\", "/")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensões
db.init_app(app)
ma.init_app(app)

# Criar tabelas no banco
with app.app_context():
    db.create_all()

# Schemas para serialização
cliente_schema = ClienteSchema()
clientes_schema = ClienteSchema(many=True)

# --- ROTAS CLIENTES ---

@app.route('/clientes', methods=['GET'])
def listar_clientes():
    clientes = Cliente.query.all()
    return clientes_schema.jsonify(clientes)

@app.route('/clientes', methods=['POST'])
def criar_cliente():
    data = request.json
    errors = cliente_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    novo = Cliente(
        nome=data['nome'],
        telefone=data.get('telefone'),
        fiado=data.get('fiado', 0.0)
    )
    db.session.add(novo)
    db.session.commit()
    return cliente_schema.jsonify(novo), 201

@app.route('/clientes/<int:id>', methods=['PUT'])
def editar_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    data = request.json
    cliente.nome = data.get('nome', cliente.nome)
    cliente.telefone = data.get('telefone', cliente.telefone)
    cliente.fiado = data.get('fiado', cliente.fiado)
    db.session.commit()
    return cliente_schema.jsonify(cliente)

@app.route('/clientes/<int:id>', methods=['DELETE'])
def deletar_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    db.session.delete(cliente)
    db.session.commit()
    return '', 204

@app.route('/clientes/<int:id>/fiado', methods=['PUT'])
def atualizar_fiado(id):
    cliente = Cliente.query.get_or_404(id)
    data = request.json
    if 'fiado' in data:
        try:
            cliente.fiado = float(data['fiado'])
            db.session.commit()
        except ValueError:
            return jsonify({"error": "Fiado deve ser número"}), 400
    return cliente_schema.jsonify(cliente)


# --- ROTAS PRODUTOS ---

@app.route('/produtos', methods=['GET'])
def listar_produtos():
    produtos = Produto.query.all()
    return jsonify([
        {'id': p.id, 'nome': p.nome, 'preco': p.preco, 'estoque': p.estoque}
        for p in produtos
    ])

@app.route('/produtos', methods=['POST'])
def criar_produto():
    data = request.json
    novo = Produto(
        nome=data['nome'],
        preco=data['preco'],
        estoque=data.get('estoque', 0)
    )
    db.session.add(novo)
    db.session.commit()
    return jsonify({
        'id': novo.id, 'nome': novo.nome,
        'preco': novo.preco, 'estoque': novo.estoque
    }), 201

@app.route('/produtos/<int:id>', methods=['PUT'])
def editar_produto(id):
    produto = Produto.query.get_or_404(id)
    data = request.json
    produto.nome = data.get('nome', produto.nome)
    produto.preco = data.get('preco', produto.preco)
    produto.estoque = data.get('estoque', produto.estoque)
    db.session.commit()
    return jsonify({
        'id': produto.id, 'nome': produto.nome,
        'preco': produto.preco, 'estoque': produto.estoque
    })

@app.route('/produtos/<int:id>', methods=['DELETE'])
def deletar_produto(id):
    produto = Produto.query.get_or_404(id)
    db.session.delete(produto)
    db.session.commit()
    return '', 204


# --- ROTAS VENDAS ---

@app.route('/vendas', methods=['POST'])
def registrar_venda():
    data = request.json
    cliente_id = data.get('cliente_id')
    itens = data.get('itens', [])  # lista de {produto_id, quantidade}

    if not itens:
        return jsonify({'error': 'Nenhum item fornecido para venda'}), 400

    venda = Venda(cliente_id=cliente_id)
    db.session.add(venda)

    for item in itens:
        produto = Produto.query.get(item['produto_id'])
        if not produto:
            db.session.rollback()
            return jsonify({'error': f"Produto id {item['produto_id']} não encontrado"}), 404
        if produto.estoque < item['quantidade']:
            db.session.rollback()
            return jsonify({'error': f"Estoque insuficiente para o produto {produto.nome}"}), 400

        produto.estoque -= item['quantidade']
        venda_item = VendaItem(
            venda=venda,
            produto=produto,
            quantidade=item['quantidade'],
            preco_unitario=produto.preco
        )
        db.session.add(venda_item)

    db.session.commit()
    return jsonify({
        'id': venda.id,
        'cliente_id': venda.cliente_id,
        'data': venda.data.isoformat()
    }), 201


if __name__ == '__main__':
    app.run(debug=True)
