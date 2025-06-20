from flask import Flask, request, jsonify
from extensions import db, ma
from models import Cliente, Produto, Venda, VendaItem

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
ma.init_app(app)

with app.app_context():
    db.create_all()

# ------------------- ROTAS DE CLIENTES -----------------------

@app.route('/clientes', methods=['GET'])
def listar_clientes():
    clientes = Cliente.query.all()
    return jsonify([
        {'id': c.id, 'nome': c.nome, 'telefone': c.telefone, 'fiado': c.fiado}
        for c in clientes
    ])

@app.route('/clientes', methods=['POST'])
def criar_cliente():
    data = request.json
    novo = Cliente(
        nome=data['nome'],
        telefone=data.get('telefone', ''),
        fiado=data.get('fiado', 0.0)
    )
    db.session.add(novo)
    db.session.commit()
    return jsonify({
        'id': novo.id,
        'nome': novo.nome,
        'telefone': novo.telefone,
        'fiado': novo.fiado
    }), 201

@app.route('/clientes/<int:id>', methods=['GET'])
def buscar_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    return jsonify({
        'id': cliente.id,
        'nome': cliente.nome,
        'telefone': cliente.telefone,
        'fiado': cliente.fiado
    })

@app.route('/clientes/<int:id>', methods=['PUT'])
def atualizar_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    data = request.json
    cliente.nome = data.get('nome', cliente.nome)
    cliente.telefone = data.get('telefone', cliente.telefone)
    cliente.fiado = data.get('fiado', cliente.fiado)
    db.session.commit()
    return jsonify({
        'id': cliente.id,
        'nome': cliente.nome,
        'telefone': cliente.telefone,
        'fiado': cliente.fiado
    })

@app.route('/clientes/<int:id>', methods=['DELETE'])
def deletar_cliente(id):
    cliente = Cliente.query.get_or_404(id)
    db.session.delete(cliente)
    db.session.commit()
    return '', 204

# ------------------- ROTAS DE PRODUTOS -----------------------

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
    novo = Produto(nome=data['nome'], preco=data['preco'], estoque=data.get('estoque', 0))
    db.session.add(novo)
    db.session.commit()
    return jsonify({'id': novo.id, 'nome': novo.nome, 'preco': novo.preco, 'estoque': novo.estoque}), 201

@app.route('/produtos/<int:id>', methods=['GET'])
def buscar_produto(id):
    produto = Produto.query.get_or_404(id)
    return jsonify({
        'id': produto.id,
        'nome': produto.nome,
        'preco': produto.preco,
        'estoque': produto.estoque
    })

@app.route('/produtos/<int:id>', methods=['PUT'])
def editar_produto(id):
    produto = Produto.query.get_or_404(id)
    data = request.json
    produto.nome = data.get('nome', produto.nome)
    produto.preco = data.get('preco', produto.preco)
    produto.estoque = data.get('estoque', produto.estoque)
    db.session.commit()
    return jsonify({'id': produto.id, 'nome': produto.nome, 'preco': produto.preco, 'estoque': produto.estoque})

@app.route('/produtos/<int:id>', methods=['DELETE'])
def deletar_produto(id):
    produto = Produto.query.get_or_404(id)
    db.session.delete(produto)
    db.session.commit()
    return '', 204

# ------------------- ROTAS DE VENDAS -----------------------

@app.route('/vendas', methods=['POST'])
def registrar_venda():
    data = request.json
    cliente_id = data.get('cliente_id')
    itens = data.get('itens', [])

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
    return jsonify({'id': venda.id, 'cliente_id': venda.cliente_id, 'data': venda.data.isoformat()}), 201

@app.route('/vendas/<int:id>', methods=['PUT'])
def atualizar_venda(id):
    venda = Venda.query.get_or_404(id)
    data = request.json

    for item in venda.itens:
        item.produto.estoque += item.quantidade
        db.session.delete(item)

    itens = data.get('itens', [])
    cliente_id = data.get('cliente_id')
    venda.cliente_id = cliente_id

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
    return jsonify({'id': venda.id, 'cliente_id': venda.cliente_id, 'data': venda.data.isoformat()})

@app.route('/vendas/<int:id>', methods=['DELETE'])
def deletar_venda(id):
    venda = Venda.query.get_or_404(id)

    for item in venda.itens:
        item.produto.estoque += item.quantidade

    db.session.delete(venda)
    db.session.commit()
    return '', 204

@app.route('/relatorios/vendas', methods=['GET'])
def relatorio_vendas():
    vendas = Venda.query.all()
    resultado = []
    for venda in vendas:
        itens = [{
            'produto': item.produto.nome,
            'quantidade': item.quantidade,
            'preco_unitario': item.preco_unitario
        } for item in venda.itens]

        resultado.append({
            'id': venda.id,
            'cliente_id': venda.cliente_id,
            'data': venda.data.isoformat(),
            'itens': itens
        })
    return jsonify(resultado)

@app.route('/relatorios/clientes', methods=['GET'])
def relatorio_clientes():
    clientes = Cliente.query.all()
    return jsonify([
        {
            'id': c.id,
            'nome': c.nome,
            'telefone': c.telefone,
            'fiado': c.fiado
        } for c in clientes
    ])

@app.route('/relatorios/produtos', methods=['GET'])
def relatorio_produtos():
    produtos = Produto.query.all()
    return jsonify([
        {
            'id': p.id,
            'nome': p.nome,
            'preco': p.preco,
            'estoque': p.estoque
        } for p in produtos
    ])

# ------------------- RODANDO O APP -----------------------

if __name__ == '__main__':
    app.run(debug=True)
