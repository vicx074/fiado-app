from flask import Flask, request, jsonify
from extensions import db, ma
from models import Cliente, Produto, Venda, VendaItem
from models.usuario import Usuario
from auth import token_required, gerar_token, SECRET_KEY
from sqlalchemy import func
from datetime import datetime, date
from flask_cors import CORS, cross_origin

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = SECRET_KEY

# Habilitar CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

db.init_app(app)
ma.init_app(app)

with app.app_context():
    db.create_all()

# ------------------- ROTAS DE AUTENTICAÇÃO -----------------------

@app.route('/auth/cadastro', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json()
    
    # Verificar se email já existe
    if Usuario.query.filter_by(email=dados['email']).first():
        return jsonify({'message': 'Email já cadastrado!'}), 400
    
    usuario = Usuario(
        nome=dados['nome'],
        email=dados['email'],
        estabelecimento=dados['estabelecimento']
    )
    usuario.definir_senha(dados['senha'])
    
    db.session.add(usuario)
    db.session.commit()
    
    return jsonify(usuario.to_dict()), 201

@app.route('/auth/login', methods=['POST'])
def login():
    dados = request.get_json()
    usuario = Usuario.query.filter_by(email=dados['email']).first()
    
    if not usuario or not usuario.verificar_senha(dados['senha']):
        return jsonify({'message': 'Email ou senha incorretos!'}), 401
    
    token = gerar_token(usuario.id)
    return jsonify({
        'token': token,
        'usuario': usuario.to_dict()
    })

@app.route('/auth/verificar', methods=['GET'])
@token_required
def verificar_token(current_user):
    return jsonify({'valid': True})

# ------------------- ROTAS DE CLIENTES -----------------------

@app.route('/clientes', methods=['GET'])
@token_required
def listar_clientes(current_user):
    clientes = Cliente.query.filter_by(usuario_id=current_user.id).all()
    return jsonify([
        {
            'id': c.id, 
            'nome': c.nome, 
            'telefone': c.telefone, 
            'fiado': c.fiado,
            'referencia': c.referencia
        }
        for c in clientes
    ])

@app.route('/clientes', methods=['POST'])
@token_required
@cross_origin()
def criar_cliente(current_user):
    data = request.json
    novo = Cliente(
        nome=data['nome'],
        telefone=data.get('telefone', ''),
        fiado=data.get('fiado', 0.0),
        usuario_id=current_user.id
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
@token_required
def buscar_cliente(current_user, id):
    cliente = Cliente.query.filter_by(id=id, usuario_id=current_user.id).first_or_404()
    return jsonify({
        'id': cliente.id,
        'nome': cliente.nome,
        'telefone': cliente.telefone,
        'fiado': cliente.fiado
    })

@app.route('/clientes/<int:id>', methods=['PUT'])
@token_required
def atualizar_cliente(current_user, id):
    cliente = Cliente.query.filter_by(id=id, usuario_id=current_user.id).first_or_404()
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
@token_required
def deletar_cliente(current_user, id):
    cliente = Cliente.query.filter_by(id=id, usuario_id=current_user.id).first_or_404()
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

@app.route('/vendas', methods=['OPTIONS'])
@cross_origin()
def vendas_options():
    return '', 204

@app.route('/vendas', methods=['POST'])
@cross_origin()
@token_required
def registrar_venda(current_user):
    data = request.json
    cliente_id = data.get('cliente_id')
    valor = data.get('valor', 0.0)
    itens = data.get('itens', [])

    if not cliente_id:
        return jsonify({'error': 'Cliente não informado'}), 400

    # Se não houver itens, registrar apenas o fiado
    if not itens:
        cliente = Cliente.query.get(cliente_id)
        if not cliente:
            return jsonify({'error': 'Cliente não encontrado'}), 404
        cliente.fiado += float(valor)
        # Salva o valor do fiado puro na venda
        venda = Venda(cliente_id=cliente_id, valor=valor, usuario_id=current_user.id)
        db.session.add(venda)
        db.session.commit()
        return jsonify({'id': venda.id, 'cliente_id': venda.cliente_id, 'data': venda.data.isoformat()}), 201

    # Lógica antiga para vendas com itens
    venda = Venda(cliente_id=cliente_id, usuario_id=current_user.id)
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
@cross_origin()
@token_required
def atualizar_venda(current_user, id):
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
@cross_origin()
@token_required
def deletar_venda(current_user, id):
    try:
        venda = Venda.query.get_or_404(id)
        cliente = Cliente.query.get(venda.cliente_id) if venda.cliente_id else None

        # Se for venda fiado puro (sem itens)
        if not venda.itens or len(venda.itens) == 0:
            db.session.delete(venda)
            db.session.flush()  # Remove a venda antes de recalcular
            if cliente:
                fiados_restantes = db.session.query(Venda).filter(
                    Venda.cliente_id == cliente.id,
                    ~db.session.query(VendaItem).filter(VendaItem.venda_id == Venda.id).exists()
                ).all()
                cliente.fiado = sum(v.valor or 0.0 for v in fiados_restantes) if fiados_restantes else 0.0
            db.session.commit()
            return '', 204
        else:
            # Se for venda com itens, devolve estoque e deleta
            for item in venda.itens:
                if item.produto:
                    item.produto.estoque += item.quantidade
            db.session.delete(venda)
            db.session.commit()
            return '', 204
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/relatorios/vendas', methods=['GET'])
def relatorio_vendas():
    vendas = Venda.query.all()
    resultado = []
    for venda in vendas:
        itens = []
        total = 0
        for item in venda.itens:
            subtotal = item.quantidade * item.preco_unitario
            total += subtotal
            itens.append({
                'produto_id': item.produto.id,
                'produto_nome': item.produto.nome,
                'quantidade': item.quantidade,
                'preco_unitario': item.preco_unitario,
                'subtotal': subtotal
            })

        resultado.append({
            'id': venda.id,
            'cliente_id': venda.cliente_id,
            'cliente_nome': venda.cliente.nome if venda.cliente_id else None,
            'data': venda.data.isoformat(),
            'total': total,
            'valor': venda.valor or total,
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

# ------------------- ROTA DE RELATÓRIO RESUMO -----------------------

@app.route('/relatorios/resumo', methods=['GET'])
def relatorio_resumo():
    inicio = request.args.get('inicio')
    fim = request.args.get('fim')
    cliente_id = request.args.get('cliente_id')

    query = Venda.query

    # Filtro por datas
    if inicio:
        try:
            inicio_date = datetime.strptime(inicio, '%Y-%m-%d').date()
            query = query.filter(Venda.data >= inicio_date)
        except ValueError:
            return jsonify({'error': 'Data de início inválida. Use formato YYYY-MM-DD'}), 400

    if fim:
        try:
            fim_date = datetime.strptime(fim, '%Y-%m-%d').date()
            query = query.filter(Venda.data <= fim_date)
        except ValueError:
            return jsonify({'error': 'Data de fim inválida. Use formato YYYY-MM-DD'}), 400

    # Filtro por cliente
    if cliente_id:
        try:
            cliente_id_int = int(cliente_id)
            query = query.filter(Venda.cliente_id == cliente_id_int)
        except ValueError:
            return jsonify({'error': 'cliente_id deve ser um número inteiro'}), 400

    vendas_filtradas = query.all()

    total_vendas = len(vendas_filtradas)

    # Faturamento total no período
    faturamento = 0
    produto_vendido_count = {}
    cliente_compras_count = {}

    for venda in vendas_filtradas:
        cliente_compras_count[venda.cliente_id] = cliente_compras_count.get(venda.cliente_id, 0) + 1
        for item in venda.itens:
            faturamento += item.quantidade * item.preco_unitario
            produto_vendido_count[item.produto_id] = produto_vendido_count.get(item.produto_id, 0) + item.quantidade

    # Produto mais vendido
    produto_mais_vendido = None
    if produto_vendido_count:
        produto_id_mais_vendido = max(produto_vendido_count, key=produto_vendido_count.get)
        produto_mais_vendido_obj = Produto.query.get(produto_id_mais_vendido)
        produto_mais_vendido = {
            'id': produto_mais_vendido_obj.id,
            'nome': produto_mais_vendido_obj.nome,
            'quantidade_vendida': produto_vendido_count[produto_id_mais_vendido]
        }

    # Cliente com mais compras
    cliente_mais_compras = None
    if cliente_compras_count:
        cliente_id_mais_compras = max(cliente_compras_count, key=cliente_compras_count.get)
        cliente_mais_compras_obj = Cliente.query.get(cliente_id_mais_compras)
        cliente_mais_compras = {
            'id': cliente_mais_compras_obj.id,
            'nome': cliente_mais_compras_obj.nome,
            'quantidade_compras': cliente_compras_count[cliente_id_mais_compras]
        }

    return jsonify({
        'total_vendas': total_vendas,
        'faturamento_total': faturamento,
        'produto_mais_vendido': produto_mais_vendido,
        'cliente_mais_compras': cliente_mais_compras
    })

# ------------------- RODANDO O APP -----------------------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
