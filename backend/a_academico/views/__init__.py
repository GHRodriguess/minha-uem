from .base import (
    obter_perfil_ativo,
    normalizar_para_busca,
    nomes_sao_compativeis
)
from .academico import (
    PerfilAcademicoView,
    MateriaDetalheView,
    UploadHorarioView,
    ControleFaltaView,
    ConfiguracaoMateriaView,
    AvaliacaoView,
    AnotacaoMateriaView
)
from .classroom import (
    ConfiguracaoClassroomView,
    ListarCursosClassroomView,
    VincularCursoClassroomView,
    ExploradorDiretoriosView,
    ArquivosMateriaClassroomView,
    AtualizarCategoriasVinculoView,
    AtualizarArquivoClassroomView,
    ObterConteudoArquivoDriveView,
    BaixarArquivoClassroomView,
    AbrirArquivoLocalView,
    AdicionarArquivoLocalView,
    SincronizarArquivosLocaisView,
    MuralClassroomView,
    MarcarMuralLidoView,
    NotificacoesClassroomView
)
from .agenda import (
    ObterInfoAgendaView,
    RegenerarTokenAgendaView,
    FeedAgendaView
)
from .suporte_admin import (
    ListarCriarChamadoView,
    DetalheChamadoSuporteView,
    AtualizarStatusChamadoView,
    VisualizarEstatisticasAdminView,
    ListarUsuariosAdminView,
    AlternarAcessoAdminView,
    ListarCriarNoticiaView,
    DetalheNoticiaView
)
from .ia import (
    ConfiguracaoIAView,
    ChatIAView,
    ConversasIAView,
    ConversaIADetalheView,
    EnviarMensagemConversaView
)
