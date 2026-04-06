"""
Pubmed Parser: A Python Parser for PubMed Open-Access XML Subset and MEDLINE XML Dataset

Author: Titipat Achakulvisut, Daniel E. Acuna
"""
import sys

if sys.version_info >= (3, 8):
    from importlib.metadata import version
else:
    from importlib_metadata import version

try:
    __version__ = version("pubmed_parser")
except Exception:
    __version__ = "0.0.0-vendored"

from .pubmed_oa_parser import (
    list_xml_path,
    parse_pubmed_xml,
    parse_pubmed_references,
    parse_pubmed_paragraph,
    parse_pubmed_caption,
    parse_pubmed_table,
)
from .medline_parser import (
    parse_medline_xml,
    parse_grant_id,
    split_mesh,
)
from .pubmed_web_parser import (
    parse_xml_web,
    parse_citation_web,
    parse_outgoing_citation_web,
)
from .utils import pretty_print
