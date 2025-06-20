from extensions import ma
from models import Cliente

class ClienteSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Cliente
        load_instance = True

    id = ma.auto_field()
    nome = ma.auto_field(required=True)
    telefone = ma.auto_field()
    fiado = ma.auto_field()
